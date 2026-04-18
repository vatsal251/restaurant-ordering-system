export const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
    }
    const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`
    res.json({ imageUrl })
}
