import express from 'express'
import amqp from 'amqplib'
import roomManager from '../websocket/roomManager.js'

const router = express.Router();

const RABBITMQ_URL = 'amqp://user:password@rabbitmq';
const QUEUE_NAME = 'execution_jobs';

const EXECUTION_TIMEOUT_MS = 60000 // 60s
const activeTimers = new Map()

let mqChannel = null


export async function initRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL)
        mqChannel = await connection.createChannel()

        await mqChannel.assertQueue(QUEUE_NAME, {durable: true})

        console.log("RabbitMQ Producer connected")
    } catch (error) {
        console.log("Producer can't connect to RabbitMQ")
        console.log(error.message)
        process.exit(1)
    }
}

async function sendJob(job) {
    let connection
    try {
        mqChannel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify(job)),
            {persistent: true}
        )

        console.log('>>> Sent job: ', job.room_id)
    } catch (error) {
        console.log ("Error while sending job: ", error.message)
    }
}

/**
 * SUBMIT
 * POST /api/v1/code/submit-code
 * get code from FE and push a job to MQ
 */
router.post("/submit-code", async (req, res) => {
    try {
        // export job
        const {room_id, language, source_code} = req.body
        const job = {
            room_id: room_id,
            language: language,
            source_code: source_code
        }

        console.log(">>> Got code ", job)
        roomManager.broadcastToRoom(room_id, {
            type: "code-execution-started"
        })

        // delete old timers
        if (activeTimers.has(room_id)) {
            clearTimeout(activeTimers.get(room_id))
            activeTimers.delete(room_id)
        }

        const newTimer = setTimeout(() => {
            console.log('>>> Job timeout set for ', room_id)

            activeTimers.delete(room_id)

            const timeoutMessage = {
                type: "code-execution-result",
                data: {
                    isError: true,
                    output: "Execution timed out. Please try again"
                }
            }

            roomManager.broadcastToRoom(room_id, timeoutMessage)
        }, EXECUTION_TIMEOUT_MS)

        activeTimers.set(room_id, newTimer)

        // send job to MQ
        await sendJob(job)
        res.status(202).json({
            message: "Job accepted"
        })

    } catch (error) {
        console.error('Error during submission process:', error.message)
        res.status(500).json({
            error: 'Internal Server Error' 
        })
    }
})

/**
 * CALLBACK
 * POST /api/v1/code/execute-callback
 * get result and push to FE
 */
router.post("/execute-callback", async (req, res) => {
    try {
        // get result
        const {room_id, isError, output} = req.body
        
        // delete the timeout or ignore if the job is timeout
        if (activeTimers.has(room_id)) {
            clearTimeout(activeTimers.get(room_id))
            activeTimers.delete(room_id)
        } else {
            console.log(`>>> Received STALE callback for ${room_id}`)
            return res.status(200).json({message: 'Job already timeout'})
        }

        // send result to FE
        const message = {
            type: "code-execution-result",
            data: {
                isError: isError,
                output: output
            }
        }

        roomManager.broadcastToRoom(room_id, message)

        console.log('>>> Callback, broadcasted to room')
        console.log('room_id: ', room_id)
        console.log('isError: ', isError)
        console.log('output:', output)

        res.status(200).json({
            message: 'Got result and broadcasted to room'
        })

    } catch (error) {
        console.error('Error during submission process:', error.message)
        res.status(500).json({
            error: 'Internal Server Error' 
        })
    }
})

export default router
