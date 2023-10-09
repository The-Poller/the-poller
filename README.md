# The Poller

Website to fetch GitHub PRs.

Available at https://the-poller.github.io/the-poller/

## Setup Instructions

1. Select `Settings` in the top-right.
2. Enter in your GitHub Token
   1. Visit https://github.com/settings/tokens
   2. Select `Generate new token > Generate new token (classic)`
   3. Under `Select scopes` select `repo`
   4. Click `Generate token`
   5. If your organization uses SSO then select `Configure SSO` and authorize your org
3. Enter in users you would like to fetch open PRs of in `Fetch Pull Requests for User`. You can view/modify the list of added users in the `Current Users` section.
4. (Optional) Add your GitHub username under `Reviewer Username` to filter by PRs you are able to review.
5. (Optional) Add a GitHub organization under `GitHub Organization` to filter by PRs in an organization.

## Development

1. Clone and install dependencies
```sh
git clone https://github.com/The-Poller/the-poller.git
cd the-poller
npm i
```

2. Run app locally
```sh
npm start
```