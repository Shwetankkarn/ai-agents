async function getGithubUser(username){

const response= await fetch(
    `https://api.github.com/users/${username}`
)

const data= await response.json();

return data;


}

async function getGithubRepos(username){

       const response = await fetch(
        `https://api.github.com/users/${username}/repos`
    );

    const data = await response.json();

    return data;

}

export {
    getGithubUser,
    getGithubRepos
};
