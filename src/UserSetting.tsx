import React, { useState, useEffect, } from 'react';
import { Button, Modal, ListGroup, FormControl, FormLabel, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCog, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import './UserSetting.css';

const UserSetting: React.FC<{
  users: string[],
  setUsers: React.Dispatch<React.SetStateAction<string[]>>,
  githubToken: string,
  setGithubToken: React.Dispatch<React.SetStateAction<string>>,
  githubOrg: string,
  setGithubOrg: React.Dispatch<React.SetStateAction<string>>,
  userName: string,
  setUserName: React.Dispatch<React.SetStateAction<string>>,
  onModalOpen?: () => void;
  onModalClose?: (changesMade: boolean) => void;
}> = ({ users, setUsers, githubToken, setGithubToken, userName, setUserName, githubOrg, setGithubOrg, onModalOpen, onModalClose }) => {
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
    if (newUser && !users.includes(newUser) && newUser !== userName) {
      setUsers([...users, newUser]);
      setNewUser('');
    }
  };

  const handleRemoveUser = (user: string) => {
    setUsers(users.filter(u => u !== user));
  };

  const handleClose = async () => {
    localStorage.setItem('githubUsers', JSON.stringify(users));
    localStorage.setItem('githubToken', githubToken);
    localStorage.setItem('userName', userName);
    localStorage.setItem('githubOrg', githubOrg);
    checkForChanges();
    setShow(false);
  }

  const handleShow = () => {
    if (onModalOpen) onModalOpen();
    setChangesMade(false);

    const storedUsers = localStorage.getItem('githubUsers');
    const storedGithubToken = localStorage.getItem('githubToken');
    const storedUserName = localStorage.getItem('userName');
    const storedGithubOrg = localStorage.getItem('githubOrg');

    if (storedUsers) {
      setPrevStoredUsers(JSON.parse(storedUsers));
    }
    if (storedGithubToken) {
      setPrevStoredGithubToken(storedGithubToken);
    }
    if (storedUserName) {
      setPrevStoredUserName(storedUserName);
    }
    if (storedGithubOrg) {
      setPrevStoredGithubOrg(storedGithubOrg);
    }
    setShow(true);
  };

  const checkForChanges = () => {
    if (JSON.stringify(users) !== JSON.stringify(prevStoredUsers)
      || githubToken !== prevStoredGithubToken
      || userName !== prevStoredUserName
      || githubOrg !== prevStoredGithubOrg) {
      setChangesMade(true)
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
              value={githubToken}
              onChange={(e) => {
                setGithubToken(e.target.value);
                localStorage.setItem('githubToken', e.target.value);
              }}
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
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              localStorage.setItem('userName', e.target.value);
            }}
            style={{ marginBottom: '10px' }}
          />
          <FormLabel>GitHub Organization</FormLabel>
          <FormControl
            type="text"
            placeholder="Enter GitHub Organization"
            value={githubOrg}
            onChange={(e) => {
              setGithubOrg(e.target.value);
              localStorage.setItem('githubOrg', e.target.value);
            }}
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
            {users.map(user => (
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