import React, { Component } from 'react'
import './App.css'
import Marketplace from '../abis/Marketplace.json'
import Web3 from 'web3'
import Navbar from './Navbar'
import Main from './Main'

var Web3EthContract = require('web3-eth-contract')
Web3EthContract.setProvider('ws://localhost:8545')
var web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545')

class App extends Component {
  async componentWillMount() {
    // await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]
    if (networkData) {
      const marketplace = new Web3EthContract(
        Marketplace.abi,
        networkData.address
      )
      this.setState({ marketplace })
      const productCount = await marketplace.methods.productCount().call()
      this.setState({ productCount })
      // Load products
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call()
        this.setState({ products: [...this.state.products, product] })
      }

      this.setState({ loading: false })
    } else {
      window.alert('Marketplace contract not deployed to detected network')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true,
    }

    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods
      .createProduct(name, price)
      .send({ from: this.state.account, gas: 6721975 })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods
      .purchaseProduct(id)
      .send({ from: this.state.account, value: price })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className='container-fluid mt-5'>
          <div className='row'>
            <main role='main' className='col-lg-12 d-flex'>
              {this.state.loading ? (
                <div id='loader' className='text-center'>
                  <p className='text-center'>Loading...</p>
                </div>
              ) : (
                <Main
                  products={this.state.products}
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    )
  }
}

export default App

// https://kovan.infura.io/v3/5dba45aa9ac343f6b92d737d46b722f6
// wss://kovan.infura.io/ws/v3/5dba45aa9ac343f6b92d737d46b722f6
