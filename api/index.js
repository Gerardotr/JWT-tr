const { json } = require('express');
const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();
app.use(express.json())

const users = [
    {
        id: "1",
        username: "Gerardo",
        password: "1234",
        isAdmin: true
    },
    {
        id: "2",
        username: "Wilber",
        password: "1234",
        isAdmin: false
    }
];

let refreshTokens = [];

app.post('/api/refresh', (req, res) => {

    const refreshToken = req.body.token;

    if (!refreshToken) return res.status(401).json('You are not authenticated')
    if(!refreshTokens.includes(refreshToken)) {
        res.status(403).json('Refresh token is no valid')

    }
    jwt.verify(refreshToken, 'myRefreshSecretey', (err, user) => {
        err && console.log(err)
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        const newAccessToken = generateAccessToken(user)
        const newRefreshToken = generateRefreshToken(user)

        refreshTokens.push(newRefreshToken)

        res.status(200).json({
            accessToken: newAccessToken, refreshToken: newRefreshToken
        })

    })
})

const generateAccessToken = (user) => {

   return  jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretey", { expiresIn: '15m' })

}

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretey")
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password
    })

    if (user) {
        // Generate token
        const acsessToken = generateAccessToken(user);
        const refreshToken  = generateRefreshToken(user);
        refreshTokens.push(refreshToken)
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            acsessToken,
            refreshToken
        })
    } else {
        res.status(400).json("Username or password incorrect")
    }
});

app.get('/api/users', (req, res) => {

    


        res.json(users)
});

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, "mySecretey", (err, user) => {
            if (err) {
                res.status(403).json("Token is not valid")
            }

            req.user = user;
            next();
        });

    } else {
        res.json(401).json("You are not authenticated")
    }

}

app.delete('/api/users/:userId', verify, (req, res) => {
    console.log(req.user.id)
    console.log(req.params.userId )
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        res.status(200).json("User has been deleted")
    } else {
        res.status(403).json("Your are not allowed to delete this user")
    }

})

app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully.");
  });
  

app.listen(5001, () => console.log('Server is running'))