const TODOSURL = "https://jsonplaceholder.typicode.com/todos/";
const USERSURL = "https://jsonplaceholder.typicode.com/users/";

let groupUsersID;
let groupUsersNAME;
// получаем данные пользователей
getJSONData(USERSURL)
  .then((result) => {
    groupUsersID = Object.groupBy(result, (user) => {
      return user.id;
    });

    groupUsersNAME = Object.groupBy(result, (user) => {
      return user.name;
    });
    const select = document.querySelector("#user-todo");
    result.forEach((user) => {
      const newOption = new Option(user.name);
      select.append(newOption);
    });
    // получаем таски
    return getJSONData(TODOSURL);
  })
  .then((result) => {
    result.forEach((task) => {
      // создаем задачи на странице
      createToDoItem(task, groupUsersID);
    });

    const addBtn = document.querySelector("form > button");
    const select = document.querySelector("#user-todo");
    // логика добавления задачи
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedUser = select.options[select.selectedIndex].text;
      if (selectedUser === "select user") {
        alert("Выберите пользователя");
        return;
      }
      const userId = groupUsersNAME[selectedUser][0].id;
      const input = document.querySelector("#new-todo");
      const taskTitle = input.value.trim();
      if (taskTitle === "") {
        alert("Вы не ввели задачу");
        return;
      }

      addTask(TODOSURL, taskTitle, userId).then((result) => {
        console.log(result);
        createToDoItem(result, groupUsersID);
      });
    });
  });

/**
 * Функция для получения данных с сервера
 * @param {String} url url для запроса на сервер
 * @returns promise (в случае resolve возвращает (массив) json)
 */
async function getJSONData(url) {
  await awaitOnline();
  try {
    const result = await fetch(url);
    const resultValue = await result.json();
    return resultValue;
  } catch (e) {
    alert(`Ошибка сервера при получении данных ${e.message}`);
    return null;
  }
}

/**
 * Функция для изменения состояния completed в задаче
 * @param {*} url url для запроса на сервер (вместе c id задачи)
 * @param {*} completedVal флаг: завершено задание или нет
 * @returns promise (в случае resolve возвращает json с измененным completed)
 */
async function patchTask(url, completedVal) {
  await awaitOnline();
  let response;
  try {
    response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ completed: completedVal }),
    });
  } catch (e) {
    alert(`Ошибка сервера при попытке изменения данных ${e.message}`);
    return null;
  }
  const result = await response.json();
  return result;
}

/**
 * Функция для удаления задачи
 * @param {*} url url для запроса на сервер (вместе c id задачи)
 * @returns код статуса: 200 если удаление прошло успешно и 500 в случае ошибки
 */
async function deleteTask(url) {
  await awaitOnline();
  let response;
  try {
    response = await fetch(url, {
      method: "DELETE",
    });
  } catch (e) {
    alert(`Ошибка сервера при попытке удаления данных ${e.message}`);
    return null;
  }

  const result = response.status;
  return result;
}

/**
 * Функция для добавления новой задачи
 * @param {*} url url для запроса на сервер
 * @param {*} task название задачи
 * @param {*} user id юзера
 * @returns promise (в случае resolve возвращает json с новой задачей)
 */
async function addTask(url, task, user) {
  await awaitOnline();
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        userId: user,
        title: task,
        completed: false,
      }),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });
  } catch (e) {
    alert(`Ошибка сервера при попытке добавления данных ${e.message}`);
    return null;
  }

  const result = await response.json();
  return result;
}

/**
 * Функция для создания таски на странице
 * @param {*} task задача в виде объекта
 * @param {*} groupUsers список пользователей, сгруппированный по id
 */
function createToDoItem(task, groupUsers) {
  const list = document.querySelector("#todo-list");
  const item = document.createElement("li");
  item.classList.add("todo-item");
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = task.completed ? true : false;
  const title = document.createElement("label");
  const user = groupUsers[task.userId][0];
  title.innerHTML = task.title + " <i>by</i> " + user.name;
  const close = document.createElement("label");
  close.textContent = "×";
  close.classList.add("close");
  item.append(check);
  item.append(title);
  item.append(close);
  list.prepend(item);

  // изменение состояния задачи
  check.addEventListener("click", (e) => {
    e.preventDefault();
    const completed = check.checked;
    patchTask(TODOSURL + task.id, completed).then((result) => {
      check.checked = result.completed;
    });
  });

  // удаление задачи
  close.addEventListener("click", () => {
    if (confirm("Вы уверены?")) {
      deleteTask(TODOSURL + task.id).then((result) => {
        if (result === 200) list.removeChild(item);
      });
    }
  });
}

function awaitOnline() {
  return new Promise((resolve) => {
    // Если клиент уже online — немедленно возвращаем результат
    if (navigator.onLine) {
      resolve();
      return;
    }
    alert("Нет соединения с Интернетом");
    // Регистрируем обработчик и решаем промис как только клиет будет online
    window.addEventListener(
      "online",
      () => resolve(),
      { once: true } // Автоматически удаляем обработчик после первого события
    );
  });
}
