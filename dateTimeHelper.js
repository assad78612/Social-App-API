const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

module.exports = {
  convertDateTime: function (rawDateTime) {
    var date = new Date(rawDateTime)
    var month = monthNames[date.getMonth()]
    var day = date.getDate()
    return month + " " + day + " - " + rawDateTime.toString().substring(16, 21)
  },
};