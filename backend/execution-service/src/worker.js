const express = require('express')
const axios = require('axios');
const connectDB = require(`./config/db`)
const Submission = require(`./models/submissionModel`)

connectDB()

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
        console.error("Error when calling Piston API:", error.message);
        throw new Error("Piston API execution failed");
    }
}

async function processSubmission(submit) {
    try {
        const response = await callPistonAPI(submit.language, submit.source_code)
        submit.result = response.run.output
        submit.submit_status = `done`
        const updateJob = await submit.save()
        console.log("Finish job", updateJob)
    } catch (error) {
        console.log(`Error when processing submission `, error)
        return
    }
}

async function startWorker() {
    while (true) {
        const job = await Submission.findOneAndUpdate(
            {submit_status: 'pending'},
            {submit_status: 'processing'},
            {sort: {_id: 1}, new: true}   
        )
        if (!job) {
            await sleep(5000)
        } else {
            console.log(job)
            await processSubmission(job)
        }
    }
}

async function main() {
    await connectDB()
    startWorker()
}

main()
