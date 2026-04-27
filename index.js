#!/usr/bin/env node

const { Command } = require("commander");
const { join } = require("path");
const { input, confirm } = require("@inquirer/prompts");
const fs = require("fs");
const ora = require("ora");
const gradient = require("gradient-string");
const figlet = require("figlet");
const Table = require("cli-table");
const packageVersion = require("./package.json");
const todosPath = join("./todos.json");
const program = new Command();
const shell = require("shelljs");

const getJson = (path) => {
  const data = fs.existsSync(path) ? fs.readFileSync(path) : [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveJson = (path, data) =>
  fs.writeFileSync(path, JSON.stringify(data, null, "\t"));

const showTodoTable = (data) => {
  const table = new Table({
    head: ["ID", "Descrição", "Status"],
    colWidths: [10, 20, 10],
  });
  data.map((todo, index) =>
    table.push([
      index,
      todo.title,
      todo.done ? gradient("green", "green")("feito") : "pendente",
    ])
  );
  console.log(table.toString());
};

program.version(packageVersion.version);

console.log(gradient("red", "green", "blue")(figlet.textSync("To-do CLI")));

program
  .command("add [todo]")
  .description("Adiciona um to-do")
  .option("-s, --status [status]", "Status inicial do to-do")
  .action(async (todo, options) => {
    let answare;
    if (!todo) {
      answare = await input({
        message: "Qual é o seu to-do?",
        validate: (value) => (value ? true : "Não é permitido um to-do vazio."),
      });
      todo = answare;
    }
    const data = getJson(todosPath);
    data.push({
      title: todo,
      done: options.status === "true" || false,
    });
    saveJson(todosPath, data);
    console.log(gradient("green", "green")("To-do adicionado com sucesso!"));
  });

program
  .command("list")
  .description("Lista os to-dos")
  .action(() => {
    const data = getJson(todosPath);
    showTodoTable(data);
  });

program
  .command("do <todo>")
  .description("Marca o to-do como feito")
  .action(async (todo) => {
    let answers;
    if (!todo) {
      answers = await input({
        message: "Qual o id do to-do?",
        validate: (value) =>
          value !== undefined ? true : "Defina um to-do para ser atualizado!",
      });
    }

    const data = getJson(todosPath);
    data[todo].done = true;
    saveJson(todosPath, data);
    console.log(gradient("green", "green")("To-do salvo com sucesso!"));
    showTodoTable(data);
  });

program
  .command("undo <todo>")
  .description("Marca o to-do como não feito")
  .action(async (todo) => {
    let answers;
    if (!todo) {
      answers = await input({
        message: "Qual o id do to-do?",
        validate: (value) =>
          value ? true : "Defina um to-do para ser atualizado!",
      });
    }

    const data = getJson(todosPath);
    data[todo].done = false;
    saveJson(todosPath, data);
    console.log(gradient("green", "green")("To-do salvo com sucesso!"));
    showTodoTable(data);
  });

program
  .command("backup")
  .description("Faz um backup dos to-dos")
  .action(async () => {
    let answers;
    answers = await confirm({
      message:
        "Você realmente gostaria de realizar o backup do arquivo todos.json?",
      default: true,
    });

    if (answers) {
      const spinner = ora("Iniciando backup... \n").start();

      setTimeout(() => {
        shell.mkdir("-p", "backup");
        const command = shell.exec("mv ./todos.json ./backup/todos.json", {
          silent: true,
        });
        if (!command.code) {
          spinner.succeed(
            gradient(
              "green",
              "green"
            )("Backup realizado com sucesso! To-dos zerados.")
          );
        } else {
          console.log(command.stderr);
          spinner.fail(gradient("red", "red")("Erro ao realizar backup."));
        }
      }, 3000);
    } else {
      console.log(gradient("#ffc107", "#ffc107")("Operação cancelada!"));
    }
  });

program.parse(process.argv);
