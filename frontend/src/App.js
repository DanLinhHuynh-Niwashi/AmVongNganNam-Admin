import React, { useState } from "react";
import SongList from "./components/FileList";
import SongUploadForm from "./components/FileUpload";

const App = () => {
    const [selectedSong, setSelectedSong] = useState(null);

    return (
        <div className="app-container">
            <SongList onSelectSong={setSelectedSong} />
            <SongUploadForm selectedSong={selectedSong} />
        </div>
    );
};

export default App;
