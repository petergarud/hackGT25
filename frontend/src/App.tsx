import axios from "axios";
import './App.css';
import React, { useState, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string | undefined>(undefined);
    const [isConverting, setIsConverting] = useState<boolean>(false);

    useEffect(() => {
        console.log(fileURL);
    }, [fileURL]);

    const handleFileChange = async (file: File) => {
        if (file) {
            setSelectedFile(file);
            const temp = URL.createObjectURL(file);
            setFileURL(temp);

            // Convert file to MP4
            setIsConverting(true);
            await convertToMP4(file);
            setIsConverting(false);
        }
    };

    const convertToMP4 = async (file: File) => {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }
        ffmpeg.FS('writeFile', file.name, await fetchFile(file));
        await ffmpeg.run('-i', file.name, 'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');

        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        const mp4File = new File([mp4Blob], 'output.mp4', { type: 'video/mp4' });

        setSelectedFile(mp4File);
        const mp4URL = URL.createObjectURL(mp4File);
        setFileURL(mp4URL);
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

    const fileTypes = ["MP4", "MOV", "GIF"];

    return (
        <div>
            <h1>First Down Detector</h1>
            <p>Have you ever wondered whether a play was <i>really</i> a first down?
            Were the referees being completely fair? Fear no more. With <b>First Down Detector </b>
            you can now determine whether a specific play was a first down or not. Just submit a clip below of the play
            and our algorithm will determine if it was a first down.</p>
            {isConverting && <p>Converting video, please wait...</p>}
            {selectedFile && !isConverting && (
            <video key={fileURL} width="640" height="360" controls>
                <source src={fileURL} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
      )}
            <FileUploader handleChange={handleFileChange} name="files" types={fileTypes}/>
            <button onClick={handleUpload} disabled={isConverting}>Upload</button>
        </div>
    );
}

export default App;