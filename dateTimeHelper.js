const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

module.exports = {
    convertDateTime: function (dateTime){
        var date = new Date(dateTime)
        var month = monthNames[date.getMonth()]
        var day = date.getDate()
        

        return month + " " + day 

    }
};