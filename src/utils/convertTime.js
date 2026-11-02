const ConvertTime = time => {
  if (!time) return "";
  const timeParts = time.split(":");
  let hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  let meridiem = "am";

  if (hours >= 12) {
    meridiem = "pm";

    if (hours > 12) {
      hours -= 12;
    }
  }
  // midnight is 12 am, not 0 am
  if (hours === 0) {
    hours = 12;
  }
  return(
    hours.toString()+ ":"+
    minutes.toString().padStart(2,"0")+
    " " +
    meridiem

  )
};
export default ConvertTime;
