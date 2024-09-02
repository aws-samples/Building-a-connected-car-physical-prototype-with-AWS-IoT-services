import './App.css';
import { useEffect, useState, useRef } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Layout from './components/Layout';
import Header from './components/Header'
import Navigation from './components/Navigation';
import axios from "axios";
import CarsGrid from './components/CarsGrid';
import DetailsGrid from './components/DetailsGrid';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplifyconfiguration.json';
import { apiConfigs } from './assets/data/apiConfigs'
import { getCurrentUser } from 'aws-amplify/auth';


import { fetchAuthSession } from 'aws-amplify/auth';






// Configure Amplify in index file or root file
Amplify.configure(config);

function App() {
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(-1)
  const [carDetails, setCarDetails] = useState({})
  const timerIdRef = useRef(null);
  const [autoRefresh, setAutoRefresh] = useState(true)

  const pollingCallback = (carName) => {
    // console.log('Polling...' + carName);
    getCarDetail(carName)
  };

  const startPolling = (carName) => {
    timerIdRef.current = setInterval(function () { pollingCallback(carName) }, 500);
  };

  const stopPolling = () => {
    clearInterval(timerIdRef.current);
  };

  const enableAutoRefresh = () => {
    if (!autoRefresh) {
      startPolling(cars[selectedCar].Name)
    }
    else {
      stopPolling()
    }
    setAutoRefresh(!autoRefresh)
  }

  function getCarDetail(name) {
    axios.get(apiConfigs.endpoint + '/cars/' + name).then((response) => {
      setCarDetails({ name: name, metrics: response.data })
    })
  }

  function setCarStatus(name, status) {
    const session = fetchAuthSession().then((response) => {


      const accessToken = response.tokens.idToken.toString()

      const data = {
        thing: name,
        desired: status
      };


      const headers = {
        'Content-Type': 'application/json'
      };
      console.log(headers)

      axios.post(apiConfigs.endpoint + '/set-status', data, { headers })
        .then((response) => {
        })
        .catch(error => {
          console.error('Error calling API:', error);
        });
    })





  }

  function setCar(index) {
    setSelectedCar(index)
    if (timerIdRef.current) {
      stopPolling(cars[index].Name)
    }
    getCarDetail(cars[index].Name)
    startPolling(cars[index].Name)
  }

  useEffect(() => {
    axios.get(apiConfigs.endpoint + '/cars').then((response) => {
      setCars(response.data)
    });

  }, []);

  return (
    <CssVarsProvider disableTransitionOnChange>
      <Authenticator>
        {({ signOut, user }) => (
          carDetails.metrics && selectedCar > -1 ?
            <Layout.Root
              sx={{
                ...({
                  height: '100vh',
                  overflow: 'hidden',
                }),
              }}
            >
              <Layout.Header>
                <Header autoRefresh={autoRefresh} clickFunction={enableAutoRefresh} />
              </Layout.Header>

              <Layout.SideNav sx={{ display: 'none' }}  >
                <Navigation cars={cars} selectedCar={selectedCar} setCar={setCar} />
              </Layout.SideNav>
              <Layout.Main>
                <DetailsGrid carDetails={carDetails} setCarStatusFunction={setCarStatus} ></DetailsGrid>
              </Layout.Main>
            </Layout.Root> : cars.length > 0 ?
              <Layout.RootTMP>
                <Layout.Header>
                  <Header autoRefresh={autoRefresh} clickFunction={enableAutoRefresh} />
                </Layout.Header>
                <CarsGrid cars={cars} setCar={setCar}  ></CarsGrid>
              </Layout.RootTMP>
              : <p>Loading car...</p>
        )}
      </Authenticator>
    </CssVarsProvider>
  );
}

export default withAuthenticator(App);