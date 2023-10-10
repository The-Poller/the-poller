import React, { useEffect, useState, } from 'react';
import { Button, FormControl, FormLabel, ListGroup, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCog, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import './UserSetting.css';

const UserSetting: React.FC<{
  settings: { users: string[]; githubToken: string; userName: string; githubOrg: string; },
  setSettings: React.Dispatch<React.SetStateAction<{ users: string[]; githubToken: string; userName: string; githubOrg: string; }>>,
  onModalOpen?: () => void;
  onModalClose?: (changesMade: boolean) => void;
}> = ({ settings, setSettings, onModalOpen, onModalClose }) => {
  const [newUser, setNewUser] = useState<string>('');
  const [show, setShow] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [changesMade, setChangesMade] = useState(false);
  const [prevStoredUsers, setPrevStoredUsers] = useState<string[]>([]);
  const [prevStoredGithubToken, setPrevStoredGithubToken] = useState<string | null>(null);
  const [prevStoredUserName, setPrevStoredUserName] = useState<string | null>(null);
  const [prevStoredGithubOrg, setPrevStoredGithubOrg] = useState<string | null>(null);

  useEffect(() => {
    if (!show) {
      if (onModalClose) onModalClose(changesMade);
    }
  }, [changesMade, show])

  const handleAddUser = () => {
    if (newUser && !settings.users.includes(newUser) && newUser !== settings.userName) {
      setSettings(prevSettings => ({ ...prevSettings, users: [...settings.users, newUser] }));
      setNewUser('');
    }
  };

  const handleRemoveUser = (user: string) => {
    setSettings(prevSettings => ({ ...prevSettings, users: settings.users.filter(u => u !== user) }));
  };

  const handleClose = async () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    checkForChanges();
    setShow(false);
  }

  const handleShow = () => {
    if (onModalOpen) onModalOpen();
    setChangesMade(false);

    const storedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    setPrevStoredUsers(storedSettings.users || []);
    setPrevStoredGithubToken(storedSettings.githubToken || '');
    setPrevStoredUserName(storedSettings.userName || '');
    setPrevStoredGithubOrg(storedSettings.githubOrg || '');
    setShow(true);
  };

  const checkForChanges = () => {
    if (JSON.stringify(settings.users) !== JSON.stringify(prevStoredUsers)
      || settings.githubToken !== prevStoredGithubToken
      || settings.userName !== prevStoredUserName
      || settings.githubOrg !== prevStoredGithubOrg) {
      setChangesMade(true);
    }
  };


  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip id="button-tooltip">Settings</Tooltip>}
      >
        <Button
          variant="outline-light"
          onClick={handleShow}
          className="border-0"
          style={{
            backgroundColor: 'transparent',
            color: 'white'
          }}
        >

          <FaCog />
        </Button>

      </OverlayTrigger>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormLabel className='required'>Github Token</FormLabel>
          <div style={{ position: 'relative' }}>
            <FormControl
              type={showToken ? 'text' : 'password'}
              placeholder="Enter Github Token"
              value={settings.githubToken}
              onChange={(e) => setSettings(prevSettings => ({ ...prevSettings, githubToken: e.target.value }))}
              style={{ marginBottom: '10px', paddingRight: '40px' }}
            />
            <Button
              variant="outline-secondary"
              style={{
                position: 'absolute',
                right: '10px',
                bottom: '7px',
                padding: '0 5px'
              }}
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </div>
          <FormLabel>Reviewer Username</FormLabel>
          <FormControl
            type="text"
            placeholder="Enter reviewer username"
            value={settings.userName}
            onChange={(e) => setSettings(prevSettings => ({ ...prevSettings, userName: e.target.value }))}
            style={{ marginBottom: '10px' }}
          />
          <FormLabel>GitHub Organization</FormLabel>
          <FormControl
            type="text"
            placeholder="Enter GitHub Organization"
            value={settings.githubOrg}
            onChange={(e) => setSettings(prevSettings => ({ ...prevSettings, githubOrg: e.target.value }))}
            style={{ marginBottom: '10px' }}
          />
          <FormLabel className='required'>Fetch Pull Requests for User</FormLabel>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <FormControl
              type="text"
              placeholder="Enter username to fetch pull requests"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              style={{ flex: 1, marginRight: '10px' }}
            />
            <Button onClick={handleAddUser}>
              <FaPlus />
            </Button>
          </div>
          <FormLabel style={{ display: 'block', marginTop: '10px' }}>Current Users</FormLabel>
          <ListGroup>
            {settings.users.map(user => (
              <ListGroup.Item key={user} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{user}</span>
                <Button variant="danger" size="sm" onClick={() => handleRemoveUser(user)}>Remove</Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default UserSetting;