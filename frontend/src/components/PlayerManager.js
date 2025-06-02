import React, { useEffect, useState } from "react";
import { Button, Form, Modal, ListGroup, Spinner, Alert } from "react-bootstrap";
import { FaBan, FaEdit, FaTrash } from "react-icons/fa";
import './PlayerManager.css';

import {
  getPlayerAccounts,
  getPlayerStatus,
  getBanByUserId,
  createBan,
  updateBan,
  deleteBan,
} from "../APIs/player-api";

const PlayerManager = () => {
  const [players, setPlayers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentBan, setCurrentBan] = useState(null);
  const [loading, setLoading] = useState(true);

  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [editingBan, setEditingBan] = useState(false);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadStatus(selectedPlayer._id);
      loadCurrentBan(selectedPlayer._id);
    }
  }, [selectedPlayer]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const response = await getPlayerAccounts();
      setPlayers(response.data.players);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async (userId) => {
    try {
      const response = await getPlayerStatus(userId);
      const status = response.data;
      setStatuses((prev) => {
        const filtered = prev.filter((s) => s.user_id?._id !== userId);
        return [...filtered, status];
      });
    } catch (err) {
      console.error("Failed to load player status:", err);
    }
  };

  const loadCurrentBan = async (userId) => {
    try {
      const response = await getBanByUserId(userId);
      const ban = response.data;
      console.log(ban)
      if (!ban.expiresAt || new Date(ban.expiresAt) > new Date()) {
        setCurrentBan(ban);
      } else {
        setCurrentBan(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentBan(null);
      } else {
        console.error("Error loading ban:", err);
      }
    }
  };

  const selectedPlayerStatus = selectedPlayer
    ? statuses.find((status) => status.user_id?._id === selectedPlayer._id)
    : null;

  const openBanModalForCreate = (player) => {
    setSelectedPlayer(player);
    setBanReason("");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 0);

    setBanExpiry(tomorrow.toISOString().slice(0, 16));
    setEditingBan(false);
    setBanModal(true);
  };

  const openBanModalForEdit = () => {
    if (!currentBan) return;
    setBanReason(currentBan.reason);
    setBanExpiry(currentBan.expiresAt ? currentBan.expiresAt.substring(0, 16) : "");
    setEditingBan(true);
    setBanModal(true);
  };

  const handleBanSubmit = async () => {
    if (!banReason.trim()) {
      alert("Please provide a reason.");
      return;
    }

    setBanLoading(true);
    try {
      if (editingBan && currentBan) {
        await updateBan({
          banId: currentBan._id,
          reason: banReason,
          expiresAt: banExpiry || null,
        });
      } else {
        await createBan({
          userId: selectedPlayer._id,
          reason: banReason,
          expiresAt: banExpiry || null,
        });
      }

      setBanModal(false);
      await loadCurrentBan(selectedPlayer._id);
    } catch (err) {
      alert("Failed to save ban: " + (err.response?.data?.message || err.message));
    } finally {
      setBanLoading(false);
    }
  };

  const handleDeleteBan = async () => {
    setBanLoading(true);
    try {
      if (!currentBan) throw new Error("No active ban found");

      await deleteBan(currentBan._id);
      setConfirmDeleteModal(false);
      await loadCurrentBan(selectedPlayer._id);
    } catch (err) {
      alert("Failed to delete ban: " + (err.response?.data?.message || err.message));
    } finally {
      setBanLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <div className="player-manager container">
      <h1 className="mb-4">Player Manager</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-wrap gap-4">
        <div className="player-list col-md-4">
          <h4>Player List</h4>
          <ListGroup>
            {players.map((player) => (
              <ListGroup.Item
                key={player._id}
                action
                onClick={() => setSelectedPlayer(player)}
                active={selectedPlayer?._id === player._id}
              >
                {player.name} ({player.email}){" "}
                {player._id === selectedPlayer?._id && currentBan && <span className="text-danger">(Banned)</span>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>

        <div className="player-details col-md-7">
          {selectedPlayer ? (
            <>
              <h4>Player Info</h4>
              <p><strong>Name:</strong> {selectedPlayer.name}</p>
              <p><strong>Email:</strong> {selectedPlayer.email}</p>
              <p><strong>Admin:</strong> {selectedPlayer.isAdmin ? "Yes" : "No"}</p>

              {currentBan ? (
                <Alert className="ban-alert">
                  <strong>BANNED</strong>: {currentBan.reason}
                  <br />
                  <em>Expires: {currentBan.expiresAt || "Never"}</em>
                  <div className="mt-3 d-flex gap-2">
                    <Button variant="warning" onClick={openBanModalForEdit} size="sm">
                      <FaEdit /> Edit Ban
                    </Button>
                    <Button variant="outline-danger" onClick={() => setConfirmDeleteModal(true)} size="sm">
                      <FaTrash /> Delete Ban
                    </Button>
                  </div>
                </Alert>
              ) : (
                <Button variant="danger" onClick={() => openBanModalForCreate(selectedPlayer)}>
                  <FaBan className="me-2" />
                  Ban this player
                </Button>
              )}

              <hr />
              <h4>Account Status</h4>
              {selectedPlayerStatus ? (
                <div>
                  <p><strong>Instrument Tokens:</strong> {selectedPlayerStatus.instrument_token}</p>
                  <p><strong>Song Tokens:</strong> {selectedPlayerStatus.song_token}</p>
                  <p><strong>Unlocked Instruments:</strong> {selectedPlayerStatus.unlocked_instruments?.join(", ") || "None"}</p>
                  <p><strong>Unlocked Songs:</strong> {selectedPlayerStatus.unlocked_songs?.length || 0}</p>

                  <hr />
                  {selectedPlayerStatus.highscore?.length > 0 ? (
                    selectedPlayerStatus.highscore.map((score, index) => (
                      <div key={score._id || index} className="mb-3 ps-2 border-start border-3 border-warning">
                        <p><strong>Song:</strong> {score.song_id?.songName} ({score.song_id?.genre})</p>
                        <p><strong>Composer:</strong> {score.song_id?.composer}</p>
                        <p><strong>BPM:</strong> {score.song_id?.bpm}</p>
                        <p><strong>Easy Score:</strong> {score.easyScore} ({score.easyState})</p>
                        <p><strong>Hard Score:</strong> {score.hardScore} ({score.hardState})</p>
                      </div>
                    ))
                  ) : (
                    <p>No highscore data available.</p>
                  )}
                </div>
              ) : (
                <p>No account status found for this player.</p>
              )}
            </>
          ) : (
            <p>Select a player to view details.</p>
          )}
        </div>
      </div>

      {/* Ban Create/Edit Modal */}
      <Modal show={banModal} onHide={() => setBanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingBan ? "Update Ban" : "Ban Player"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Reason</Form.Label>
              <Form.Control
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Cheating, abusive behavior..."
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Expires At (optional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={banExpiry}
                onChange={(e) => setBanExpiry(e.target.value)}
              />
              <Form.Text className="text-muted">Leave blank for permanent ban.</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBanModal(false)} disabled={banLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBanSubmit} disabled={banLoading}>
            {banLoading ? (editingBan ? "Updating..." : "Banning...") : (editingBan ? "Update Ban" : "Confirm Ban")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Delete Ban Modal */}
      <Modal show={confirmDeleteModal} onHide={() => setConfirmDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Ban</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove the ban for <strong>{selectedPlayer?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDeleteModal(false)} disabled={banLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBan} disabled={banLoading}>
            {banLoading ? "Deleting..." : "Delete Ban"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlayerManager;
