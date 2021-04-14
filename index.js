//-------const-------

const axios = require("axios");
const Lime = require("lime-js");
const BlipSdk = require("blip-sdk");
const WebSocketTransport = require("lime-transport-websocket");
const uri = "https://avatars.githubusercontent.com/u/4369522";
const github_url = "https://api.github.com/orgs/takenet/repos?";
const client_id = "d2460f3bb1640c25772c";
const client_secret = "83f2c933ea28b9302b35b5539e7684cb626cc716";
const query_filter = "&per_page=5&language=C#&sort=created&direction=des";

//-------Server Take -------

const IDENTIFIER = "chatparadesafio";
const ACCESS_KEY = "dG9vNW81UVVxcEZCWWs0Q0pwRVY=";

const client = new BlipSdk.ClientBuilder()
  .withIdentifier(IDENTIFIER)
  .withAccessKey(ACCESS_KEY)
  .withTransportFactory(() => new WebSocketTransport())
  .build();

client
  .connect()
  .then(function (session) {
    fetchGithubData()
      .then((resp) => {
        let firstEntry = true;
        let messageCount = 0;

        if (session.state !== "established") {
          firstEntry = true;
        }

        client.addMessageReceiver(true, (message) => {
          if (
            message.content.state !== "composing" &&
            message.content.state !== "paused"
          ) {
            messageCount++;
          }

          if (
            message.content.state !== "composing" &&
            message.content.state !== "paused" &&
            firstEntry
          ) {
            client.sendMessage({
              id: Lime.Guid(),
              type: "application/vnd.lime.collection+json",
              to: message.from,
              content: {
                itemType: "text/plain",
                items: [
                  "Olá, espero que esteja tudo bem. Sou a Lora responsável por passar os repositórios em C# mais antigos da Take.",
                  "Mesmo eu sendo um robô e ficando um pouco confusa sobre a forma de quantificar o tempo, posso te ajudar nessa tarefa.",
                  "Envie alguma mensagem, e estarei te mostrando agora os repositórios!",
                ],
              },
            });

            firstEntry = false;
          }

          if (
            !firstEntry &&
            messageCount > 1 &&
            message.content.state !== "composing" &&
            message.content.state !== "paused"
          ) {
            client.sendMessage({
              id: Lime.Guid(),
              type: "application/vnd.lime.collection+json",
              to: message.from,
              content: {
                itemType: "application/vnd.lime.document-select+json",
                items: resp,
              },
            });
          }
        });
      })
      .catch((err) => {
        console.warn(err);
      });
  })
  .catch(function (err) {
    console.warn(err);
  });

//-------API GitHub -------

async function fetchGithubData() {
  const repos = [];
  try {
    const response = await axios.get(
      `${github_url}client_id=${client_id}&client_secret=${client_secret}${query_filter}`
    );

    response.data.forEach((repo) => {
      const { name, description } = repo;
      repos.push({
        header: {
          type: "application/vnd.lime.media-link+json",
          value: {
            title: name,
            text: description,
            type: "image/jpeg",
            uri,
          },
        },
      });
    });

    return repos;
  } catch (err) {
    console.warn(err);
  }
}
