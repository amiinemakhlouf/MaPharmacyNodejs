const { Sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');



// Create a Sequelize instance using the DATABASE_URL environment variable
const sequelize = new Sequelize('postgres://postgres:mysecret@localhost:5437/postgres', {
  dialect: 'postgres',
});


// Define the Account model
const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
      }
      

  }
);
User.beforeCreate(async (user, options) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
});
User.beforeUpdate(async (user, options) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
});

User.destroy({ where: { email: 'amiinemakhlouf@gmail.com' } })
  .then(() => {
    console.log('Users deleted');
  })
  .catch((error) => {
    console.error(error);
  });
 
  

  const listOfOtpRegister=[]
  const listOfOtpReset=[]


// Create an Express app
const express = require('express');
const app = express();
app.use(bodyParser.json());

// Parse URL-encoded request body
app.use(bodyParser.urlencoded({ extended: true }));


// Register a route for registering new accounts

app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;




  try {
    await sequelize.sync();
    const user = await User.findOne({ where: { email: email } });

    if (user) {
      res.status(500).json("User already exists");
      console.log(user);
    } else {
      
        const code= generateRandomString()
        sendEmailOtp(email,code)
        listOfOtpRegister.push({code:code,email:email,password:password,username:username})
        res.status(200).json({respone:"one more step"});
      } 
    }
   catch (error) {
    console.log(error);
    res.status(500).json("Something went wrong");
  }
});


  


// Register a route for sending a confirmation email
app.post('/api/account/confirmation', async(req, res) => {
  const { email, code } = req.body;
  let otpFound = false;
  var password="";
      var username="";

  for (const otp of listOfOtpRegister) {
    if (otp.code === code && otp.email === email) {
      otpFound = true;
      password=otp.password
      username=otp.username
      break;
    }
  }

  if (otpFound) {
    try {
      await sequelize.sync();
      
      const customer = await User.create({ email, password, username });
      res.status(200).json({username: "welcome"});
    } catch (error) {
      console.error(error);
      res.status(500).json({response: "Something went wrong"});
    }
  } else {
    res.status(400).send("wrong password");
  }
})



// Start the Express app
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// Authenticate to the database and save a new user
async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    
      
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } 
}
function generateRandomString () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

function sendEmailOtp(email,code)
{
  const nodeMailer = require('nodemailer');
const mailTransporter = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'almountakhabtn@gmail.com',
    pass: 'bbwjojspfaqueaaf',
  },
});

const details = {
  from: 'almountakhabtn@gmail.com',
  to: email,
  subject: 'otp confirmation',
  text: code,
};

  mailTransporter.sendMail(details, (err) => {
    if (err) {
      console.log('email not sent', err);
      res.status(500).send('Failed to send confirmation email');
    } else {
      console.log('email sent');
      res.send('Confirmation email sent');
      listOfOtpRegister.push({email:email,code:code})
    }
  });
  
}

// login
app.post('/api/login', async(req, res) => {
  const { email, password } = req.body;

  User.findOne({
    where: {
      email: email
    }
  })
  .then((user) => {
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error(err);
          return;
        }
    
        if (result) {
          console.log('User', "amiine", 'logged in successfully!');
          res.status(200).json({username:user.username,email:user.email})
        } else {
          
          res.status(400).send("wrong password")
        }
      });


    } else {
      res.status(400).send("user not exist")
    }
  })
  .catch((error) => {
    console.error(error);
  });


  
})


//forgetPAssword
app.post('/api/user/reset_password', async(req, res) => {

  const { email } = req.body;

  const emailExists = await User.findOne({ where: { email: email }});
if (emailExists) {
  const code= generateRandomString()
  sendEmailOtp(email,code)
  listOfOtpReset.push({email:email,code:code})
        res.status(200).json({response:"email exist"})
        
} else {
  
  res.status(400).send("aucun compte lié a cet email")
}

app.post('/api/usr/otp_check',(req,res)=>{

  const{email,code}=req.body
  let otpFound = false;


for (const otp of listOfOtpReset) {
    if (otp.code === code && otp.email === email) {
      otpFound = true;
      break;
    }
  }

  if (otpFound) {

    res.status(200).json({response:"correct code"})
    

  } else {
    res.status(400).send("wrong code");
  }
  
})
app.post('/api/password/reset', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      // Handle case where user is not found
      console.log("user not found")
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    console.log("user exist")
    await user.save();

    res.status(200).json({ success: "Password updated successfully" });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});





})





// Call the main function to authenticate and save a new user
main();
