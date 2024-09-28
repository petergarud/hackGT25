import axios from "axios";
import './App.css';
import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string | undefined>(undefined);

    const handleFileChange = (file: File) => {
        if (file) {
            setSelectedFile(file);
            let temp:string = URL.createObjectURL(file);
            setFileURL(temp);
            console.log(temp);
            console.log(fileURL);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully', response.data);
        } catch (error) {
            console.error('Error uploading file', error);
        }
    };

    const fileTypes = ["MP3", "MOV", "GIF"];

    return (
        <div>
            <h1>First Down Detector</h1>
            <p>Have you ever wondered whether a play was <i>really</i> a first down?
            Were the referees being completely fair? Fear no more. With <b>First Down Detector </b>
            you can now determine whether a specific play was a first down or not. Just submit a clip below of the play
            and our algorithm will determine if it was a first down.</p>
            {selectedFile && (
            <video width="640" height="360" controls>
                <source src={fileURL} type={selectedFile.type} />
            </video>
      )}
            <FileUploader handleChange={handleFileChange} name="files" types={fileTypes}/>
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
}

export default App;
