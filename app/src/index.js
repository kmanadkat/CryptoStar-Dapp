import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;
    App.spinner('createSpinner', 'hidden');
    App.spinner('lookupSpinner', 'hidden');
    App.spinner('infoSpinner', 'hidden');
    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  setStatus: function(id, status, error=false) {
    const statusEl = document.getElementById(id);
    statusEl.innerHTML = status;
    if(error){
      statusEl.style.color = "#dc3545"
    }else{
      statusEl.style.color = "#00C852"
    }
  },

  spinner: function(id, state){
    document.getElementById(id).style.visibility = state;
  },

  createStar: async function() {
    App.spinner('createSpinner', 'visible');
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;
    if(name.trim() === '' || id.trim() === ''){
      App.setStatus('status', "Field(s) Can't Be Empty!", true);
      App.spinner('lookupSpinner', 'hidden');
      return;
    }
    try {
      await createStar(name, id).send({from: this.account});
      App.setStatus('status', "New Star Created! Owner: " + this.account);
      App.spinner('createSpinner', 'hidden');
    } catch (error) {
      App.setStatus('status', 'Perhaps Token Already Minted, Try With Different Id', true);
      App.spinner('createSpinner', 'hidden');
      console.error(error);
    }
  },

  // Implement Task 4 Modify the front end of the DAPP
  lookUp: async function (){
    App.spinner('lookupSpinner', 'visible');
    const {lookUptokenIdToStarInfo} = this.meta.methods;
    const starId = document.getElementById('lookid').value;
    // Check if field is empty
    if(starId.trim() === ''){
      App.setStatus('status', 'Star Id Cannot Be Empty!', true);
      App.spinner('lookupSpinner', 'hidden');
      return;
    }
    // Find Token & Update Field + Status
    try {
      const starName = await lookUptokenIdToStarInfo(parseInt(starId)).call();
      document.getElementById('starNameResult').value = starName;
      if(starName.trim() === ''){
        App.setStatus('status', 'Star Not Found or Star Name is Null!', true);
      }else{
        App.setStatus('status', 'Star Found!');
      }
      App.spinner('lookupSpinner', 'hidden');
    } catch (error) {
      App.setStatus('status', '⛔️Something Went Wrong!', true);
      App.spinner('lookupSpinner', 'hidden');
      console.error(error);
    }
  },

  // Get Token Name & Symbol
  getTokenInfo: async function(){
    App.spinner('infoSpinner', 'visible');
    const {name, symbol} = this.meta.methods;
    try {
      const tokenName = await name().call();
      const tokenSymbol = await symbol().call();
      document.getElementById('tokenName').value = tokenName;
      document.getElementById('tokenSymbol').value = tokenSymbol;
      App.setStatus('status', 'Token Info Updated!');
      App.spinner('infoSpinner', 'hidden');
    } catch (error) {
      App.setStatus('status', '⛔️Something Went Wrong!', true);
      App.spinner('infoSpinner', 'hidden');
      console.error(error);
    }
  }
};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    try {
      // use MetaMask's provider
      App.web3 = new Web3(window.ethereum);
      await window.ethereum.enable(); // get permission to access accounts
      App.setStatus("status", "Metamask Connected!");
    } catch (error) {
      console.error("Metamask Connection request canceled", error);
      App.setStatus("status", "Metamask Connection aborted!", true);
    }
  } else {
    App.setStatus("status", "Metamask Not Found!", true);
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"),);
  }
  App.start();
});