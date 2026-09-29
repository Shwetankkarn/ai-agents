async function requestGithub(path) {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "GitHub request failed");
    return data;
}

async function getGithubUser(username) {
    return requestGithub(`/users/${encodeURIComponent(username)}`);
}

async function getGithubRepos(username) {
    return requestGithub(`/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`);
}

export { getGithubUser, getGithubRepos };
