function Transaction() {
  let transactionForm = document.getElementById("transactionForm");
  transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const sender = document.getElementById("sender").value;
    const receiver = document.getElementById("receiver").value;
    const amount = document.getElementById("amount").value;
    if (!sender || !receiver || !receiver) {
      alert("Please fill in all fields");
      return;
    }

    const transactionData = {
      sender,
      receiver,
      amount,
    };

    simulateFraud(transactionData)
      .then((response) => {
        document.getElementById(
          "fraudProbability"
        ).innerText = `Fraud Probability:${response.fraudProbability}%`;
        document.getElementById(
          "transactionDetail"
        ).innerText = `Transaction Detail:${response.transactionDetail}`;
        addTransactionToHistory(
          sender,
          receiver,
          amount,
          response.fraudProbability
        );
      })

      .catch((err) => {
        console.error("Error:", err);
      });
  });

  function simulateFraud(transactionData) {
    return new Promise((resolve) => {
      const fraudProbability = Math.random() * 100;
      let fraudRisk = "Low";
      if (fraudProbability > 80) fraudRisk = "High";
      else if (fraudProbability > 50) fraudRisk = "Medium";
      resolve({
        fraudProbability: fraudProbability.toFixed(2),
        transactionDetail: `The transaction from ${transactionData.sender} to ${transactionData.receiver} of ₹${transactionData.amount} is ${fraudRisk}.`,
      });
    });
  }
  function addTransactionToHistory(sender, receiver, amount, fraudProbability) {
    const tableBody = document
      .getElementById("transactionHistory")
      .getElementsByTagName("tbody")[0];
    const newRow = tableBody.insertRow();
    const senderCell = newRow.insertCell(0);
    const receiverCell = newRow.insertCell(1);
    const amountCell = newRow.insertCell(2);
    const fraudProbabilityCell = newRow.insertCell(3);
    senderCell.textContent = sender;
    receiverCell.textContent = receiver;
    amountCell.textContent = `${amount}`;
    fraudProbabilityCell.textContent = `${fraudProbability}%`;
    if (fraudProbability > 80) {
      fraudProbabilityCell.classList.add("fraud-high");
    } else if (fraudProbability > 50) {
      fraudProbabilityCell.classList.add("fraud-medium");
    } else {
      fraudProbabilityCell.classList.add("fraud-low");
    }
  }
}
Transaction();
