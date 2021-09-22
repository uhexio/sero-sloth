import React from 'react';
import {
    IonApp,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonBadge,
    IonTabs
} from '@ionic/react';
import {Redirect, Route, Switch} from 'react-router-dom';
import { IonReactHashRouter } from '@ionic/react-router';
import BatchTransfer from './pages/BatchTransfer';
import { rocketOutline,colorWandOutline} from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import i18n from './i18n';
import OneKey from "./pages/OneKey";

const App: React.FC = () => (
  <IonApp>
      <IonReactHashRouter>
          <IonTabs>
              <IonRouterOutlet animated={true}>
                  {/*<Switch>*/}
                  <Route path="/batchTransfer" component={BatchTransfer}  exact={true} />
                  <Route path="/onekey" component={OneKey}  exact={true} />
                  <Route path="/" render={() => <Redirect to="/batchTransfer" />} exact={true} />
                  {/*</Switch>*/}
              </IonRouterOutlet>
              <IonTabBar slot="bottom">
                  <IonTabButton tab="batchTransfer" href="/batchTransfer">
                      <IonIcon icon={rocketOutline} />
                      <IonLabel>{i18n.t("batchTransfer")}</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="onekey" href="/onekey">
                      <IonIcon icon={colorWandOutline} />
                      <IonLabel>{i18n.t("onekey")}</IonLabel>
                  </IonTabButton>

              </IonTabBar>
          </IonTabs>
      </IonReactHashRouter>
  </IonApp>
);

export default App;
