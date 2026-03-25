const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(err => ({
                message: err.message,
                field: err.path.join('.')
            }));
            return res.status(400).json({ success: false, errors });
        }
        
        next();
    };
};

module.exports = validate;
