'use strict'

import mongoose from 'mongoose'
import os from 'os'
const _SECOND = 5000 // 5 seconds

// count the number of connections
export const countConnect = () => {
    const numConnection = mongoose.connections.length
    console.log(`Number of connections: ${numConnection}`)
}

// check over load
export const checkOverLoad = () => {
    setInterval(() => {
        const numConnection = mongoose.connections.length
        const numCores = os.cpus().length

        // Example maximum number of connections based of cores
        const maxConnections = numCores * 5 // 5 connections per core

        // console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`);
        if (numConnection > maxConnections) {
            console.warn(`High number of connections: ${numConnection}. Maximum allowed: ${maxConnections}`)
        }
    }, _SECOND) // Monitor every 5 seconds
}
