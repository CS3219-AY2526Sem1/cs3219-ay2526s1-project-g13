const express = require('express')
const axios = require('axios');
const connectDB = require(`./config/db`)
const Submission = require(`./models/submissionModel`)

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callPistonAPI(language, source_code) {
    try {
        const pistonURL = "http://piston:2000/api/v2/execute"
        const payload = {
            language: language,
            version: "*",
            files: [
                {
                    content: source_code
                }
            ]
        }
        const response = await axios.post(pistonURL, payload)
        return response.data
    } catch (error) {
        throw error
    }
}

async function processSubmission(submit) {
    // If fail to connect Piston API for 3 times, then the submit is failed
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            const response = await callPistonAPI(submit.language, submit.source_code)
            let result
            
            if (response.run.status) { // runtime error
                result = {
                    isError: true,
                    output: response.run.output
                }
            } else if (response.run.code !== 0) { // runcode != 0 error
                result = {
                    isError: true,
                    output: response.run.output
                }
            } else { // successfully run the code
                result = {
                    isError: false,
                    output: response.run.output
                }
            }

            submit.result = result
            submit.submit_status = `done`

            const updateJob = await submit.save()
            console.log(">> Finish job", updateJob)
            return
        } catch (error) {
            if (error.response) {
                const statusCode = error.response.status
                if (statusCode >= 400 && statusCode < 500) {
                    result = {
                        isError: true,
                        output: error.response.data.message
                    }
                    
                    submit.submit_status = `done`
                    submit.result = result
                    const updateJob = await submit.save()

                    console.log(">>> Piston api error: ", error.response.message)
                    console.log(">>> Finish job (error)", updateJob)
                    return
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
    submit.submit_status = 'failed'
    submit.result = {
        isError: true,
        output: "Code execution service is unavailable. Please try again later."
    }
    const updateJob = await submit.save()
    console.log('>>> Failed job ', updateJob)
}

async function startWorker() {
    while (true) {
        // timestamp 3 mins before
        const STUCK_TIMEOUT = new Date(Date.now() - 3 * 60 * 1000);

        const job = await Submission.findOneAndUpdate(
            {
                $or: [
                    {submit_status: 'pending'},
                    {
                        submit_status: 'processing',
                        processing_start_at: { $lt: STUCK_TIMEOUT }
                    }
                ]
            },
            {
                submit_status: 'processing',
                processing_start_at: new Date()
            },
            {sort: {_id: 1}, new: true}   
        )
        if (!job) {
            await sleep(5000)
        } else {
            console.log('>>> Process job', job)
            await processSubmission(job)
        }
    }
}

async function main() {
    await connectDB()
    startWorker()
}

main()
