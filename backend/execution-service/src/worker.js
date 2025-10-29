const aqmp = require('amqplib')
const axios = require('axios')

const RABBITMQ_URL = process.env.RABBITMQ_URL
const QUEUE_NAME = process.env.QUEUE_NAME
const CALLBACK_URL = process.env.CALLBACK_URL
const PISTON_URL = process.env.PISTON_URL

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callPistonAPI(language, source_code) {
    try {
        const payload = {
            language: language,
            version: "*",
            files: [
                {
                    content: source_code
                }
            ]
        }
        const response = await axios.post(PISTON_URL, payload)
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * 
 * @param {*} submit 
 * @returns result: {room_id, isError, output}
 */
async function processSubmission(submit) {
    // If fail to connect Piston API for 3 times, then the submit is failed
    let result = {}
    result.room_id = submit.room_id
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            const response = await callPistonAPI(submit.language, submit.source_code)
                   
            // set isError
            if (response.run.status) { // runtime error
                result.isError = true
            } else if (response.run.code !== 0) { // runcode != 0 error
                result.isError = true
            } else { // successfully run the code
                result.isError = false
            }
            // set output
            result.output = response.run.output

            console.log(">>> Finish job", result)
            return result
        } catch (error) {
            if (error.response) {
                const statusCode = error.response.status
                if (statusCode >= 400 && statusCode < 500) {
                    result.isError = true
                    result.output = error.response.data.message
                    console.log(">>> Piston api error: ", error.response.message)
                    console.log(">>> Finish job (error)", result)
                    return result
                } else {
                    // rerun
                    console.log(">>> Piston api temporary error: ", statusCode)
                }
            } else {
                // rerun
                console.log(">>> Piston api doesn't respond\n", error.message)
            }
            if (i === MAX_RETRIES) {
                break
            }
        }
        const delay = RETRY_DELAY_MS * i;
        console.log(`>>> Wait ${delay}ms before reconnect to Piston api`)
        await sleep(delay)
    }
    // failed (after 3 tries)
    result.isError = true
    result.output = "Code execution service is unavailable. Please try again later."
    console.log('>>> Failed job ', result)
    return result
}

async function startWorker() {
    try {
        const connection = await aqmp.connect(RABBITMQ_URL)
        const channel = await connection.createChannel()

        await channel.assertQueue(QUEUE_NAME, { durable: true})

        console.log(">>> Consumer connected RabbitMQ")

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg != null) {
                const job = JSON.parse(msg.content.toString())
                console.log('>>> Got job: ', job.room_id)
                
                const result = await processSubmission(job)
                
                // callback
                try {
                    await axios.post(CALLBACK_URL, result)
                    console.log('>>> Sent callback: ', result.room_id)
                    channel.ack(msg)
                } catch (callbackError) {
                    console.log(">>> Error when callback ", callbackError.message)
                    channel.ack(msg)
                }
            }
        }, {
            noAck: false
        })
    } catch (error) {
        console.log(">>> Worker's error: ", error)
        process.exit(1)
    }
}

async function main() {
    startWorker()
}

main()
