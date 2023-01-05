#!/usr/bin/env node

const { readFile, writeFile } = require('fs');

readFile('./mail.txt', (err, data) => {
  if (err) throw err;
  console.log(String(data));
});