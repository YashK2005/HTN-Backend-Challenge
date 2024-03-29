# Yash Kothari - Hack the North Backend Challenge 2024

I used Node.js/Express with GraphQL and a SQLite database.



### Project Structure
schema.js: 
  - contains all the graphQL - defines the schema, has the different types, queries, mutations, as well as the SQL database logic
  - if I could do this again, I would have definitely split this up into multiple files as it got quite long at the end

index.js: starts everything up - initializes the project
mydb.sqlite: 
  - I chose to make two tables: one for users one for skills
  - users contains the list of all the users, with name, company, email, phone as well as an id
  - skills contains every single skill & rating with a foreign key, user_id, which is linked to users.id

In the models folder, I have the json of example data, db.js, and populate.js

populate.js: run once to read and parse the json, and insert all the mock data into the db

db.js: defines and creates the tables for the sqlite db

---- 

I implemented the All Users Endpoint, User Endpoint, Updating User Data Endpoint, and Skills Endpoint (with optional min/max frequency parameters).

To run/test this:

Run ```node index.js``` and open http://localhost:3000/graphql

