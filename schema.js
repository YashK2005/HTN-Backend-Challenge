//This file defines the schema for the GraphQL
//It has all the different types as well as the possible queries and mutations
//It also incldues the SQL query logic

const { 
  GraphQLSchema, 
  GraphQLObjectType, 
  GraphQLString, 
  GraphQLInt, 
  GraphQLList, 
  GraphQLNonNull, 
  GraphQLInputObjectType,
} = require('graphql');

const db = require('./models/db');

// Skill input type
const SkillType = new GraphQLObjectType({
  name: 'Skill',
  fields: () => ({
    id: { type: GraphQLInt },
    skill: { type: GraphQLString },
    rating: { type: GraphQLInt },
    name: { type: GraphQLString }, 
    frequency: { type: GraphQLInt }, 

  }),
});

// User input type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    skills: {
      type: new GraphQLList(SkillType),
      resolve(parent, args) {
        return new Promise((resolve, reject) => {
          db.all('SELECT * FROM skills WHERE user_id = ?', [parent.id], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          });
        });
      },
    },
  }),
});



// Root query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: { // User information endpoint - searches by ID
      type: UserType,
      args: { id: { type: GraphQLInt } },
      resolve(parent, args) {
        return new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE id = ?', [args.id], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        });
      },
    },
    users: { // All users endpoint - returns all users
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return new Promise((resolve, reject) => {
          db.all('SELECT * FROM users', (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          });
        });
      },
    },
    skills: { // Skills endpoint - returns skills with their frequency 
      type: new GraphQLList(SkillType),
      args: {
        data: {
          type: new GraphQLInputObjectType({
            name: 'SkillInput',
            fields: () => ({ //filter out skills based on frequency
              min_frequency: { type: GraphQLInt, defaultValue: 0 },
              max_frequency: { type: GraphQLInt, defaultValue: Number.MAX_SAFE_INTEGER },
            }),
          }),
        },
      },
      resolve(parent, args) {
        return new Promise((resolve, reject) => {
          db.all(`SELECT skill as name, COUNT(skill) as frequency
                FROM skills
                GROUP BY skill
                HAVING frequency BETWEEN ? AND ?;`, 
                [args.data.min_frequency, args.data.max_frequency], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          });
        });
      },
    } 
  },
});



//Updating input types
const UpdateSkillInputType = new GraphQLInputObjectType({
  name: 'UpdateSkillInput',
  fields: {
    skill: { type: GraphQLString },
    rating: { type: GraphQLInt },
  },
});

const UpdateUserInputType = new GraphQLInputObjectType({
  name: 'UpdateUserInput',
  fields: {
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    skills: { type: new GraphQLList(UpdateSkillInputType) },
  },
});

//Updating User Data endpoint
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        data: { type: new GraphQLNonNull(UpdateUserInputType) },
      },
      resolve(parent, { id, data }) {
        //stores the fields and values to be updated (not including skills)
        let updateFields = []; 
        let updateValues = [];

        //getting the keys of the data object (not including skills)
        Object.keys(data).forEach(key => {
          if (key !== 'skills' && data[key] != null) {
            updateFields.push(`${key} = ?`);
            updateValues.push(data[key]);
          }
        });
        //user basic data - skills are handled later   
        updateValues.push(id); 

        const userUpdatePromise = new Promise((resolve, reject) => {
          if (updateFields.length > 0) { // Ensure there are fields to update - if there aren't don't run the sql query or there will be an error
            db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues, function(err) {
              if (err) reject(err);
              else resolve(id); 
            });
          } else {
            resolve(id); 
          }
        });
        //updating the skills
        let skillPromises = [];
        if (Array.isArray(data.skills)) {
          skillPromises = data.skills.map(skill => {
            return new Promise((resolve, reject) => { //checking if the user has the skill already
              db.get(`SELECT id FROM skills WHERE user_id = ? AND skill = ?`, [id, skill.skill], (err, row) => {
                if (err) {
                  reject(err);
                } else if (row) { //if the skill exists and the user has it, update it
                  db.run(`UPDATE skills SET rating = ? WHERE id = ?`, [skill.rating, row.id], function(err) {
                    if (err) reject(err);
                    else resolve(row.id);
                  });
                } else { //otherwise add a new skill to the db
                  db.run(`INSERT INTO skills (user_id, skill, rating) VALUES (?, ?, ?)`, [id, skill.skill, skill.rating], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                  });
                }
              });
            });
          });
        }
        //returning the updated user and skills
        return Promise.all([userUpdatePromise, ...skillPromises]).then(() => {
          return new Promise((resolve, reject) => {
            // Fetch the updated user information
            db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
              if (err) {
                reject(err);
                return;
              }
        
              // Now fetch the updated skills for the user
              db.all(`SELECT * FROM skills WHERE user_id = ?`, [id], (err, skills) => {
                if (err) {
                  reject(err);
                  return;
                }
        
                // Attach the fetched skills to the user object
                user.skills = skills;
        
                // Resolve the promise with the fully updated user object
                resolve(user);
              });
            });
          });
        });
        
      },
    },
  },
});

  
  
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});