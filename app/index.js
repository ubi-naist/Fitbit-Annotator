import * as document from "document";

let buttons = document.getElementsByClassName("large-button");
buttons.forEach(element => {
  element.addEventListener("click", (evt) => {
    console.log(`${element.id} pressed`);
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