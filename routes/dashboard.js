const router = require("express").Router();
const { sequelize , User } = require("../db");
const authorization = require("../middleware/authorization");


router.post("/", authorization,async (req,res)=>{
    try {
        //req.user trae la información desde authorization 


        const user = await User.findOne({ where : { "user_id" : req.user}});

        res.json(user.dataValues); // devuelve la información del usuario desde traída por query desde la db;
    } catch (error) {
        console.log(error);
        res.status(500).json("Server error");
    }
});

router.get("/", async(req,res)=>{
    try {
        const users = await User.findAll().then((data)=>{
            return data
        })
        .catch((err)=> console.log(err));

        if(!users || !users.length) return res.json("No users found")
        if(users) return res.json(users);
    } catch (error) {
        console.log(error.message);
        res.send("error");
    }
})

router.patch("/rating", async (req,res)=>{
    try {
        const { userId } = req.query;
        const { rating } = req.body;

    const user = await User.findOne({
        where : {
            user_id:  userId
        }
    }).then((data)=> data).catch(console.log);


    user.rating_as_seller = rating;

    await user.save();


    return res.json(user);

    } catch (error) {
        console.log(error.message)
    }
})

module.exports = router;