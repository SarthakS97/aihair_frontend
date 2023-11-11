const express = require('express');
const { Storage } = require('@google-cloud/storage');
// const multer = require('multer');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const Replicate = require('replicate');
const replicate = new Replicate({
    auth: 'key',
});
require('dotenv').config(); // Load environment variables from .env file


const app = express();
const PORT = 5000;
app.use(express.json()); // Add this line to parse JSON requests
app.use(fileUpload());

const corsOptions = {
    origin: 'http://localhost:3000', // Replace with the actual origin of your React app
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
});

const bucketName = 'avataryaidemo_bucket'; // Replace with your Google Cloud Storage bucket name

// const upload = multer({
//     storage: multer.memoryStorage(),
//     fileFilter: (req, file, cb) => {
//         const filetypes = /zip/;
//         const mimetype = filetypes.test(file.mimetype);
//         if (mimetype) {
//             return cb(null, true);
//         }
//         cb('Error: Only zip files are allowed!');
//     },
// });
// const outputLinks = [];

async function startTraining(publicUrl) {
    try {
        const training = await replicate.trainings.create('stability-ai', 'sdxl', 'c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316', {
            destination: 'sarthaks97/final_finetune',
            input: {
                input_images: publicUrl,
                "use_face_detection_instead": true,
            },
            webhook: 'https://aihair-training.onrender.com/webhook_training',
            webhook_events_filter: ['completed'],
        });
        console.log(`URL: https://replicate.com/p/${training.id}`);
    } catch (error) {
        console.error('Error starting training:', error.message);
    }
}

app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;
    const email = req.query.email;
    const fileName = file.name;

    // Upload the zip file to Google Cloud Storage
    const bucketName = 'avataryaidemo_bucket';
    const fileStream = storage.bucket(bucketName).file(fileName).createWriteStream();
    axios.post('https://aihair-prediction.onrender.com/email', { email })
        .then(response => {
            console.log('Email sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending email:', error);
        });
    fileStream.on('error', (err) => {
        console.error('Error uploading file to Google Cloud Storage:', err);
        res.status(500).json({ error: 'Error uploading file' });
    });

    fileStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        res.json({ publicUrl });
        console.log('Public URL:', publicUrl);
        console.log('Email:', req.body.email);
        startTraining(publicUrl);
    });

    fileStream.end(file.data);
});



// app.post('/webhook_predictions', (req, res) => {
//     const payload = req.body;

//     // Check if payload contains 'output' property and it's an array
//     if (payload && Array.isArray(payload.output) && payload.output.length > 0) {
//         // Extract the link from the output array
//         const outputLink = payload.output[0];
//         outputLinks.push(outputLink);
//     } else {
//         console.error('Invalid payload format or missing output link.');
//     }

//     res.status(200).send('Webhook received successfully');
//     if (outputLinks.length === 19) {

//     }
// });

// app.get('/getOutputLinks', (req, res) => {
//     res.json({ outputLinks });
// });

app.use(express.static(path.join(__dirname, './aihair/build')));
app.get('*', function (_, res) {
    res.sendFile(path.join(__dirname, './aihair/build/index.html'), function (err) {
        res.status(500).send(err);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
