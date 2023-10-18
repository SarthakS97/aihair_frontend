import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';

const ref_links = [
  "https://storage.googleapis.com/avataryaidemo_bucket/ref_neutral.png",
  "https://storage.googleapis.com/avataryaidemo_bucket/ref_smile.jpeg",
  "https://storage.googleapis.com/avataryaidemo_bucket/left_ref.jpeg",
  "https://storage.googleapis.com/avataryaidemo_bucket/right_ref.jpeg",
  "https://storage.googleapis.com/avataryaidemo_bucket/right_profile.png",
  "https://storage.googleapis.com/avataryaidemo_bucket/left_profile.png",
]

const bad_ref_links = [
  "https://i.pinimg.com/564x/1c/98/32/1c983209bd2a44d3b605a9730616587b.jpg",
  "https://i.pinimg.com/564x/5c/d8/9d/5cd89dda90478107cbd71feddea60ced.jpg",
  "https://i.pinimg.com/564x/d2/a8/1a/d2a81a6cdc465888f740473e02a16ae9.jpg",
  "https://i.pinimg.com/736x/d6/39/71/d639710b2a9ec8ea38063779c40e748a.jpg"
]

const DriveUpload = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [outputLinks, setOutputLinks] = useState([]);
  const [email, setEmail] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleImageUpload = (event) => {
    const files = event.target.files;
    const imagesArray = Object.keys(files).map((key) => files[key]);
    setSelectedImages(imagesArray);
  };

  const handleUploadToDrive = () => {
    const zip = new JSZip();
    const promises = [];

    selectedImages.forEach((image, index) => {
      promises.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            zip.file(`image_${index}.jpg`, reader.result.split(',')[1], { base64: true });
            resolve();
          };
          reader.readAsDataURL(image);
        })
      );
    });

    Promise.all(promises).then(() => {
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'images.zip');
        formData.append('email', email); // Add email to formData

        // Append email to FormData
        axios.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            email: email,
          },
        }).then((response) => {
          console.log('Public URL:', response.data.publicUrl);
        });
      });
    });
  };

  useEffect(() => {
    const fetchOutputLinks = async () => {
      try {
        const response = await axios.get('/getOutputLinks');
        if (response.data && response.data.outputLinks) {
          setOutputLinks(response.data.outputLinks);
          console.log(response.data.outputLinks)
        }
      } catch (error) {
        console.error('Error fetching output links:', error);
      }
    };

    fetchOutputLinks();
  }, []);  // Run this effect once on component mount

  return (
    <div>
      <div>
        <h1>Upload at least 12 high-quality selfies.  <br></br></h1>
        <h3>The results depend on the quality of selfies you upload.<br></br></h3>
        <h3>Good selfies✅</h3>
        <ul>
          <li><span STYLE="font-weight:bold">Must</span> include selfies in all the angles shown under Good selfies and avoid those under Bad selfies</li>
          <li>Smile without showing teeth</li>
          <li>Make sure you take your selfies in a well-lit area</li>
          <li>Make sure the selfies are not blurry</li>
        </ul>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {ref_links.map((link, index) => (
            <img key={index} src={link} alt={`Image ${index}`} style={{ width: '200px', height: 'auto', marginRight: '10px' }} />
          ))}
        </div>
        <h3>Bad selfies❌</h3>
        <ul>
          <li>Please don't wear sunglasses</li>
          <li>Make sure you are the only one in the selfie. </li>
          <li>Do not cover your face</li>
        </ul>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {bad_ref_links.map((link, index) => (
            <img key={index} src={link} alt={`Image ${index}`} style={{ width: '250px', height: '200px', marginRight: '10px' }} />
          ))}
        </div>
      </div>
      <br></br>
      <input type="email" placeholder="Enter your email" value={email} onChange={handleEmailChange} />
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
      <button onClick={handleUploadToDrive}>Upload</button>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {outputLinks.slice(1).map((link, index) => (
          <div key={index} style={{ width: '50%', padding: '10px' }}>
            <img src={link} alt={`Image ${index}`} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriveUpload;
