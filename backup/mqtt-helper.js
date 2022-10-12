import mqtt from 'mqtt';
export function connect(iconSource){
  const  client = mqtt.connect("mqtt://192.168.1.157",{clientId:"mqttjs01"})
  const button = document.createElement('button');
  button.classList.add('basic-button');

  const image = document.createElement("img");
  image.setAttribute("src", iconSource);
  image.classList.add('icon');
  button.appendChild(image);

  const sideMenu = document.getElementById('side-menu-left');
  sideMenu.appendChild(button);

  return button;
}