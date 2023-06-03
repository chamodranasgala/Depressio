import UserModel from "../models/User.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from "../config.js";
import { response } from "express";

/** middleware for verify user */
export async function verifyUser(req, res, next){
    try{
        const {username} = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await UserModel.findOne({username: username});
        if(!exist) return res.status(404).send({error: "Can't find User!"});
        next();
    } catch (error){
        return res.status(404).send({error: "Authentication Error"})
    }
}

/** POST: http://localhost:3000/api/register 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req, res){
    try{
        const {username, password, profile, email} = req.body;
        // check the existing user
        const existUsername = new Promise((resolve, reject) => {
            UserModel.findOne({username: username}).exec().then(
                document => {
                    if(document){
                        reject({error: "Please use unique username"})
                    }else{
                        resolve()
                    }
                }
            ).catch(
                error => {reject(error)}
            )
        });
        // check for existing email
        const existEmail = new Promise((resolve, reject) => {
            UserModel.findOne({ email: email }).exec().then(
                document => {
                    if ( document){
                        reject({ error : "Please use unique Email"})
                    } else {
                        resolve()
                    }
                }
                
            ).catch(
                error => {reject(error)}
            )    
        });


        Promise.all([existEmail,existUsername])
            .then(() => {
                if(password){
                    bcrypt.hash(password, 10)
                        .then( hashedPassword => {
                            
                            const user = new UserModel({
                                username: username,
                                password: hashedPassword,
                                profile: profile || '',
                                email: email
                            });

                            // return save result as a response
                            user.save()
                                .then(result => res.status(201).send({ msg: "User Register Successfully"}))
                                .catch(error => res.status(500).send({msg: "User Register Unsucessful"}))

                        }).catch(error => {
                            return res.status(500).send({
                                error : "Enable to hashed password"
                            })
                        })
                }
            }).catch(error => {
                return res.status(500).send({ error})
            })
    } catch (error){
        return res.status(500).send({msg: "User Register case3"});
    }
}

/** POST: http://localhost:3000/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/
export async function login(req, res){
    const {username, password} = req.body;
    try{
        UserModel.findOne({username: username}).exec().then(
                    user => {
                        bcrypt.compare(password, user.password)
                        .then(passwordCheck =>{
                            if(!passwordCheck) return res.status(400).send({error: "Password does not Match"})
                            // create jwt token
                            const token = jwt.sign({
                                userId: user._id,
                                username: user.username
                            }, ENV.JWT_SECRET, {expiresIn: "24h"});

                            return res.status(200).send({
                                msg: "Login Sucessfull...! ",
                                username: user.username,
                                token
                            }
                            )
                        })
                        .catch(
                            error => {
                                return res.status(400).send({error: "password does not Match"})
                            }
                        )
                    }
                ).catch(error =>{
                    return res.status(404).send({error: "Username not Found"})
                });
    } catch (error) {
        return res.status(500).send({error});}
}


/** GET: http://localhost:3000/api/user/example123 */
export async function getUser(req, res){
    const {username} = req.params;
    try{
        if (!username) return res.status(501).send({error: "Invalid Username"});

        // UserModel.findOne({username},function(err,user){
        //     if (err) return res.status(500).send({err});
        //     if(!user) return res.status(501).send({ error : "Couldn't Find the User"});
        //     return res.status(201).send(user);
        // })

        UserModel.findOne({username: username}).exec()
            .then(
                user =>{
                     /** remove password from user */
                    // mongoose return unnecessary data with object so convert it into json
                    const { password, ...rest } = Object.assign({}, user.toJSON());
                    
                    return res.status(201).send(rest);
                }
            )
            .catch(
                error => {return res.status(501).send({ error : "Couldn't Find the User"});}
            )
    }catch(error){
        return res.status(404).send({error: "Cannot Find User Data"});
    }

}

/** PUT: http://localhost:3000/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    profile : ''
}
*/
export async function updateUser(req,res){
    try {
        
        const userId = req.query.id;
        // const { userId } = req.user;

        if(userId){
            const body = req.body;

            // update the data
            UserModel.updateOne({ _id : userId }, body).exec().then(
                (response) => {
                    res.status(201).send({ msg : "Record Updated...!"})
                }
            )
        }else{
            return res.status(401).send({ error : "User Not Found...!"});
        }

    } catch (error) {
        return res.status(401).send({ error });
    }
}

/** GET: http://localhost:3000/api/generateOTP */
export async function generateOTP(req,res){
    res.json('generateOTP route')
}

/** GET: http://localhost:3000/api/verifyOTP */
export async function verifyOTP(req,res){
    res.json('verifyOTP route')
}


// successfully redirect user when OTP is valid
/** GET: http://localhost:3000/api/createResetSession */
export async function createResetSession(req,res){
    res.json('createResetSession route')
}

// update the password when we have valid session
/** PUT: http://localhost:3000/api/resetPassword */
export async function resetPassword(req,res){
    res.json('resetPassword route')
}