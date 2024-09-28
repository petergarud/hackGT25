import axios from "axios";
import './App.css';
import React, { useState, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import api from './api';

const ffmpeg = new FFmpeg();

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string | undefined>(undefined);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [isImage, setIsImage] = useState<boolean>(false);

    useEffect(() => {
        console.log(fileURL);
    }, [fileURL]);

    const handleFileChange = async (file: File) => {
        if (file) {
            setSelectedFile(file);
            const temp = URL.createObjectURL(file);
            setFileURL(temp);

            // Convert file to MP4
            if (!(file.type.startsWith("video"))) {
                setIsImage(true);
                setIsConverting(true);
                await convertToMP4(file);
                setIsConverting(false);
            } else {
                setIsImage(false);
            }
        }
    };

    const convertToMP4 = async (file: File) => {
        if (!ffmpeg.loaded) {
            await ffmpeg.load();
        }
        await ffmpeg.writeFile('input', await fetchFile(file));
        await ffmpeg.exec(['-i', 'input', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');

        const mp4Blob = new Blob([data], { type: 'video/mp4' });
        const mp4File = new File([mp4Blob], 'output.mp4', { type: 'video/mp4' });

        setSelectedFile(mp4File);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully', response.data);
        } catch (error) {
            console.error('Error uploading file', error);
            //console.log(error.response);
        }
    };

    const fileTypes = ["MP4", "MOV", "PNG", "JPEG"];

    return (
        <div>
            <h1>First Down Detector</h1>
            <p>Have you ever wondered whether a play was <i>really</i> a first down?
            Were the referees being completely fair? Fear no more. With <b>First Down Detector </b>
            you can now determine whether a specific play was a first down or not. Just submit a clip below of the play
            and our algorithm will determine if it was a first down.</p>
            {isConverting && <p>Converting file, please wait...</p>}
            {selectedFile && !isConverting && !isImage && (
            <video key={fileURL} width="640" height="360" controls>
                <source src={fileURL} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
            )}
            {selectedFile && !isConverting && isImage && (
            <img src={fileURL} width="640" height="360" alt="Display not working"/>
            )}
            <FileUploader handleChange={handleFileChange} name="files" types={fileTypes}/>
            <button onClick={handleUpload} disabled={isConverting}>Upload</button>
        </div>
    );
}

export default App;
