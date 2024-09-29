import axios from "axios";
import { Buffer } from 'buffer';
import './App.css';
import React, { useState, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import api from './api';

const ffmpeg = new FFmpeg();

function App() {
    const [firstDown, setFirstDown] = useState<string | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string | undefined>(undefined);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [isImage, setIsImage] = useState<boolean>(false);
    const [base64, setBase64] = useState();
    const [isUploading, setIsUploading] = useState<boolean>(false);

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
        setIsUploading(true);
        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                responseType: "arraybuffer",
            }).then(function (response) {
                console.log(response.data);
                setFirstDown(Buffer.from(response.data, "binary").toString("base64"))
            })
            // console.log('File uploaded successfully', response.data);
        } catch (error) {
            console.error('Error uploading file', error);
            //console.log(error.response);
        }
        setIsUploading(false);
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
            <div className="left-container">
                {selectedFile && !isConverting && !isImage && (
                    <video key={fileURL} className="file-url" controls>
                        <source src={fileURL} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
                {selectedFile && !isConverting && isImage && (
                    <img src={fileURL} className="file-url" alt="Display not working" />
                )}
                <FileUploader handleChange={handleFileChange} name="files" types={fileTypes} />
                <button onClick={handleUpload} className="green-button" disabled={isConverting && isUploading} >Upload</button>
            </div>
            {isUploading && (<div>
                    <div className="loading loading--full-height"></div>
                    {/* <div className="loading-2 loading-2--full-height"></div> */}
            </div>)}
            {firstDown && !isUploading && (<img src={`data:image/jpeg;charset=utf-8;base64,${firstDown}`} width="640" height="360" alt="First Down" />
            )}
        </div>
    );
}

export default App;
