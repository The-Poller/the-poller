import { request } from '@octokit/request';
import { Endpoints } from '@octokit/types';
import 'bootstrap/dist/css/bootstrap.css';
import { useEffect, useMemo, useState } from 'react';
import { Button, Container, Navbar, ProgressBar, Spinner, Table } from 'react-bootstrap';
import { FaCog, FaSmile } from 'react-icons/fa';
import { FaCodePullRequest } from 'react-icons/fa6';
import Moment from 'react-moment';
import './App.css';
import UserSetting from './UserSetting';


type SearchIssuesResponse = Endpoints["GET /search/issues"]["response"]["data"]["items"][0];
type TableData = { [repoUrl: string]: SearchIssuesResponse[] };

type SettingsType = {
  users: string[];
  githubToken: string;
  userName: string;
  githubOrg: string;
};

const App: React.FC = () => {
  const [data, setData] = useState<TableData>({});
  const [progress, setProgress] = useState<number>(0);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [fullyLoaded, setFullyLoaded] = useState<boolean>(false);
  const [loadedAt, setLoadedAt] = useState<Date>();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [noPRsToReview, setNoPRsToReview] = useState(false);


  const [settings, setSettings] = useState<SettingsType>({
    users: [],
    githubToken: '',
    userName: '',
    githubOrg: ''
  });

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('githubUsers') || '[]');
    const storedGithubToken = localStorage.getItem('githubToken');
    const storedUserName = localStorage.getItem('userName');
    const storedGithubOrg = localStorage.getItem('githubOrg');

    setSettings({
      users: storedUsers || [],
      githubToken: storedGithubToken || '',
      userName: storedUserName || '',
      githubOrg: storedGithubOrg || ''
    });
  }, []);

  const resetState = () => {
    setData({});
    setProgress(0);
    setLoadFailed(false);
    setFullyLoaded(false);
    setLoadedAt(undefined);
    setIsLoadingData(false);
    setNoPRsToReview(false);
  };

  const isSettingsEmpty = useMemo(() => {
    return settings.users.length === 0 || !settings.githubToken;
  }, [settings.users, settings.githubToken]);

  if (isSettingsEmpty || isSettingsOpen) {
    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="lg" className="align-items-center">
          <Container className="d-flex align-items-center justify-content-between">
            <Navbar.Brand className="d-flex align-items-center">
              <FaCodePullRequest className="mr-2" /> The Poller™
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" className="d-flex align-items-center justify-content-end">
              <UserSetting
                settings={settings}
                setSettings={setSettings}
                onModalOpen={() => {
                  setIsSettingsOpen(true);
                }}
                onModalClose={(changesMade) => {
                  if (changesMade) {
                    resetState();
                  };
                  setIsSettingsOpen(false)
                }}
              />
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 100px)' }}>
          <div className="text-center">
            <FaCog size={32} />
            <p>You must set all settings first</p>
          </div>
        </Container>
      </div>
    );
  }

  const loadPRs = () => (async () => {
    if (isLoadingData) {
      return;
    }

    setData({});
    setIsLoadingData(true);
    setLoadedAt(undefined);
    setProgress(0);
    setLoadFailed(false);

    try {
      const PRs: TableData = {};
      const query = [
        'is:open',
        'is:pull-request',
        'draft:false',
        'archived:false',
      ];
      if (settings.githubOrg) {
        query.push(`org:${settings.githubOrg}`);
      }
      if (settings.userName) {
        query.push(`review-requested:${settings.userName}`);
      }
      for (const [idx, user] of Object.entries(settings.users)) {
        const result = await request('GET /search/issues', {
          headers: {
            authorization: `token ${settings.githubToken}`,
          },
          q: query.join(' ') + ` author:${user}`,
        });
        for (const item of result.data.items || []) {
          PRs[item.repository_url] ??= [];
          PRs[item.repository_url].push(item);
        }
        setProgress(+idx + 1);
        setData(PRs);
      }

      setIsLoadingData(false);
      setFullyLoaded(true);
      setLoadedAt(new Date())

      if (Object.keys(PRs).length === 0) {
        setNoPRsToReview(true);
      } else {
        setNoPRsToReview(false);
      }
    } catch (error) {
      setFullyLoaded(false);
      setLoadFailed(true);
      setIsLoadingData(false);
      console.error('Error fetching data:', error);
    }
  })

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="align-items-center">
        <Container className="d-flex align-items-center justify-content-between">
          <Navbar.Brand className="d-flex align-items-center">
            <FaCodePullRequest className="mr-2" /> The Poller™
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="d-flex align-items-center justify-content-end">
            <UserSetting
              settings={settings}
              setSettings={setSettings}
              onModalOpen={() => {
                setIsSettingsOpen(true);
              }}
              onModalClose={(changesMade) => {
                console.log(changesMade);
                if (changesMade) {
                  resetState();
                };
                setIsSettingsOpen(false)
              }}
            />
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <div style={{ "display": "flex", justifyContent: 'center', flexDirection: "column", alignItems: 'center', marginTop: '10px' }}>
          {noPRsToReview ? (
            <>
              <FaSmile size={64} color="green" />
              <p>All PRs have been reviewed already!</p>
              <Button
                variant="primary"
                onClick={loadPRs()}
                disabled={loadFailed || isLoadingData}
              >
                {isLoadingData ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    {' '}Loading...
                  </>
                ) : loadFailed ? (
                  'Try again'
                ) : (
                  'Refresh data'
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={loadPRs()}
              disabled={isLoadingData}
            >
              {isLoadingData ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  {' '}Loading...
                </>
              ) : loadFailed ? (
                'Try again'
              ) : fullyLoaded ? (
                'Refresh data'
              ) : (
                'Load Data'
              )}
            </Button>
          )}
          <div style={{ width: "50vw", marginTop: '10px', textAlign: 'center' }}>
            <ProgressBar variant={loadFailed ? 'danger' : (progress !== settings.users.length) ? '' : 'success'} animated={!loadFailed && progress !== settings.users.length} now={loadFailed ? 100 : (progress / settings.users.length) * 100} label={loadFailed ? 'Failed to load all data.' : (progress === settings.users.length) ? "All PRs loaded" : `${settings.users[progress - 1]} ${progress}/${settings.users.length}`} />
            <span hidden={!loadedAt}>Data loaded <Moment fromNow interval={1000}>{loadedAt}</Moment></span>
          </div>
        </div>
        {Object.entries(data).sort(([repoNameA], [repoNameB]) => repoNameA > repoNameB ? 1 : -1).map(([repositoryUrl, tableData]) => (
          <div id={repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)} key={repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}>
            <h2>
              <a style={{ textDecoration: 'none', color: 'inherit' }} href={`#${repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}`}>
                {repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}
              </a>
            </h2>
            <Table bordered>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>PR #</th>
                  <th style={{ width: '150px' }}>User</th>
                  <th>Pull Request</th>
                  <th style={{ width: '150px' }}>Creation time</th>
                  <th style={{ width: '150px' }}>Updated time</th>
                </tr>
              </thead>
              <tbody>
                {tableData.sort((a, b) => a.number - b.number).map((item) => (
                  <tr key={item.id}>
                    <td>{item.number}</td>
                    <td><a style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }} href={item.user?.html_url}> <img height={20} src={item.user?.avatar_url} alt={item.user?.login} />  <span>{item.user?.login}</span></a></td>
                    <td><a target="_blank" rel="noreferrer" href={item.pull_request?.html_url!}>{item.title}</a></td>
                    <td><Moment fromNow interval={1000}>{item.created_at}</Moment></td>
                    <td><Moment fromNow interval={1000}>{item.updated_at}</Moment></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
      </Container>
    </div >
  );
};

export default App;
