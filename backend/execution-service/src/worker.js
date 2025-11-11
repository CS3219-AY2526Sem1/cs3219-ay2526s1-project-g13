const aqmp = require('amqplib')
const axios = require('axios')

const RABBITMQ_URL = process.env.RABBITMQ_URL
const QUEUE_NAME = process.env.QUEUE_NAME
const CALLBACK_URL = process.env.CALLBACK_URL
const PISTON_URL = process.env.PISTON_URL

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000
const AXIOS_CONNECTION_TIMEOUT_MS = 2000
const PISTON_EXECUTION_TIMEOUT_MS = 40000 // 40s

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callPistonAPI(language, source_code, timeout_ms) {
    try {
        const payload = {
            language: language,
            version: "*",
            files: [
                {
                    content: source_code
                }
            ],
            run_timeout: 10000,
            compile_timeout: 30000
        }
        const response = await axios.post(PISTON_URL, payload, {
            timeout: timeout_ms
        })
        return response.data
    } catch (error) {
        throw error
    }
}

async function resultCallback(result) {
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            await axios.post(CALLBACK_URL, result)
            console.log('>>> Sent callback: ', result.room_id)
            return
        } catch (callbackError) {
            if (i == MAX_RETRIES) { // final error
                throw callbackError
            } else {
                const delay = i * RETRY_DELAY_MS
                await sleep(delay)
            }
        }
    }
}

/**
 * 
 * @param {*} submit 
 * @returns result: {room_id, isError, output}
 */
async function processSubmission(submit) {
    let result = {}
    result.room_id = submit.room_id

    // first 2 time: check for connection
    for (let i = 1; i <= MAX_RETRIES - 1; i++) {
        try {
            const response = await callPistonAPI(submit.language, submit.source_code, AXIOS_CONNECTION_TIMEOUT_MS)
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
                    // piston temp error
                    console.log(">>> Piston api temporary error: ", statusCode)
                }
            } else if (axios.isAxiosError(error) && error.code !== 'ECONNREFUSED') {
                // timeout / no connection
                console.log(">>> Piston api doesn't respond\n", error.message)
            } else {
                // ECONNREFUSED
                console.log(">>> Piston api is dead (ECONNREFUSED)\n", error.message)
            }

            // next try
            const delay = RETRY_DELAY_MS * i;
            console.log(`>>> Wait ${delay}ms before reconnect to Piston api`)
            await sleep(delay)
            continue
        }
        // if no error, quit try loop
        break
    }

    // final try: timeout 40s
    try {
        const response = await callPistonAPI(submit.language, submit.source_code, PISTON_EXECUTION_TIMEOUT_MS)
                   
        // set isError
        if (response.run.status) { // runtime error
            result.isError = true
            // get readable message or output
            result.output = response.run.message || response.run.output 
        } else if (response.run.code !== 0) { // runcode != 0 error
            result.isError = true
            result.output = response.run.output
        } else { // successfully run the code
            result.isError = false
            result.output = response.run.output
        }
        

        console.log(">>> Finish job", result)
        return result
    } catch (error) {
        if (error.response) {
            const statusCode = error.response.status
            if (statusCode >= 400 && statusCode < 500) {
                result.isError = true
                result.output = error.response.data.message
                return result
            }
        }
        // failed (after 3 tries)
        result.isError = true
        result.output = "Code execution service is unavailable. Please try again later."
        console.log('>>> Failed job ', result)
        return result
    }
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
                    await resultCallback(result)
                } catch (callbackError) {
                    console.log(">>> Error when callback ", callbackError.message)
                } finally {
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
