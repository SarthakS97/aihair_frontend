const express = require('express');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const Replicate = require('replicate');
const replicate = new Replicate({
    auth: process.env.REPLICATE_KEY,
});
require('dotenv').config(); // Load environment variables from .env file


const app = express();
const PORT = 5000;
app.use(express.json()); // Add this line to parse JSON requests

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

const upload = multer({ dest: 'uploads/' });

// const outputLinks = [];

async function startTraining(publicUrl) {
    try {
        const training = await replicate.trainings.create('stability-ai', 'sdxl', 'c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316', {
            destination: 'sarthaks97/final_finetune',
            input: {
                input_images: publicUrl,
                "use_face_detection_instead": true,
            },
            webhook: 'http://8219-49-205-129-224.ngrok.io/webhook_training',
            webhook_events_filter: ['completed'],
        });
        console.log(`URL: https://replicate.com/p/${training.id}`);
    } catch (error) {
        console.error('Error starting training:', error.message);
    }
}

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileName = 'images.zip';
    const email = req.query.email; // Extract the email from the request query parameters
    // console.log(email)
    // Upload file to Google Cloud Storage
    await storage.bucket(bucketName).upload(file.path, {
        destination: fileName,
    });
    axios.post('http://2e5b-49-205-129-224.ngrok.io/email', { email })
        .then(response => {
            console.log('Email sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending email:', error);
        });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    // outputLinks.push({ publicUrl, email }); // Store the public URL and email

    res.json({ publicUrl });
    console.log('Public URL:', publicUrl);
    console.log('Email:', email);
    startTraining(publicUrl);
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
