function sanitize(obj) {
    for (const key in obj) {
        if (/[$.]/.test(key)) {
            delete obj[key]
        } else if (typeof obj[key] === 'object') {
            sanitize(obj[key])
        }
    }
}

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        sanitize(req.body)
    }
    if (req.query) {
        sanitize(req.query)
    }
    if (req.params) {
        sanitize(req.params)
    }
    next()
}

module.exports = { sanitize, sanitizeInput }
