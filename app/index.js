import * as document from "document";

class ActivityButton {
  isActive = false;
  activeIconColor = "#eeeeee";
  imageElem;

  constructor(elem, {isToggle} = {}) {
    this.element = elem;
    this.id = elem.id;
    this.isToggle = isToggle || false;

    this.imageElem = elem.getElementById('image');
    this.originalIconColor = this.imageElem.style.fill;
  }

  toggle() {
    this.isActive = !this.isActive;
    this.imageElem.style.fill = this.isActive ?
      this.activeIconColor:
      this.originalIconColor;
  }
}
buttons = {};

let buttons = document.getElementsByClassName("large-button");
buttons.forEach(element => {
  switch (element.id) {
    case 'eating-button':
      buttons[element.id] = new ActivityButton(element, {isToggle: true,});
      break;
    default:
      buttons[element.id] = new ActivityButton(element);
      break;
  }
  element.addEventListener("click", (evt) => {
    const actButton = buttons[element.id];
    if (actButton.isToggle) {
      actButton.toggle();
    }
    console.log(`${element.id} pressed, isActive? ${actButton.isActive}`);
  });
});

/*
  Buttons to include:
  emoji_u1f3cb  Exercise
  emoji_u1f46a  Being with others
  emoji_u1f389  Party
  emoji_u1f3ae  Playing vgames
  emoji_u1f3e2  Working
  emoji_u1f4fa  Watching a show
  emoji_u1f622  Crying
  emoji_u1f923  Having fun
  emoji_u1f623  Anxious
  emoji_u1f973  Aroused emotion
  emoji_u1f37d  Eating
  emoji_u1f6b6  Going out (walking)
  emoji_u1f486  Relaxing
*/