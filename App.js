import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Alert,
  Button,
  Platform,
  View,
  Image,
} from "react-native";

import IAP from "react-native-iap";

// Platform select will allow you to use a different array of product ids based on the platform
const items = Platform.select({
  ios: [''], // iOS Product ID
  android: [''], // Android Product ID
});

let purchaseUpdateSubscription;
let purchaseErrorSubscription;
let img = require("./nature.jpg");

export default function App() {
  const [purchased, setPurchased] = useState(false); //set to true if the user has active subscription
  const [products, setProducts] = useState({}); //used to store list of products

  const validate = async (receipt) => {
    try {
      // send receipt to backend
      const deliveryReceipt = await fetch("http://localhost", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ data: receipt }),
      }).then((res) => {
        res.json().then((r) => {
          Alert.alert("1.Receipt: ", receipt );
          console.log('++ 1.Receipt ++ ', receipt);
          // do different things based on response
          if (r.result.error == -1) {
            console.log('++ 2.Receipt ++ ', receipt);
            Alert.alert("2.Receipt: ", receipt );
            Alert.alert("Error", "(1) There has been an error with your purchase");
          } else if (r.result.isActiveSubscription) {
            setPurchased(true);
          } else {
            Alert.alert("Expired", "your subscription has expired");
          }
        });
      });
    } catch (error) {
      console.log('++ 1.Receipt ++ ', receipt);
      Alert.alert("Receipt: ", receipt );
      Alert.alert("Error!", error.message );
    }
  };

  useEffect(() => {
    IAP.initConnection()
      .catch(() => {
        console.log("error connecting to store...");
      })
      .then(() => {
        IAP.getSubscriptions(items)
          .catch(() => {
            console.log("error finding items");
          })
          .then((res) => {
            console.log('++ getSubscriptions ++ ', res);
            setProducts(res);
          });

        // IAP.getPurchaseHistory()
        //   .catch(() => {})
        //   .then((res) => {
        //     try {
        //       const receipt = res[res.length - 1].transactionReceipt;
        //       if (receipt) {
        //         validate(receipt);
        //       }
        //     } catch (error) {}
        //   });
      });

    purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
      console.log('++ purchaseErrorListener ++ ', error);
      if (!(error["responseCode"] === "2")) {
        Alert.alert(
          "Error",
          "(2) There has been an error with your purchase, error code: " +
            error["code"]
        );
      }
    });
    purchaseUpdateSubscription = IAP.purchaseUpdatedListener((purchase) => {
      console.log('++ purchaseUpdatedListener ++ ', purchase);
      Alert.alert("purchaseUpdatedListener: ", purchase );
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        validate(receipt);
        IAP.finishTransaction(purchase, false);
      }
    });

    return () => {
      try {
        purchaseUpdateSubscription.remove();
      } catch (error) {}
      try {
        purchaseErrorSubscription.remove();
      } catch (error) {}
      try {
        IAP.endConnection();
      } catch (error) {}
    };
  }, []);

  if (purchased) {
    return (
      <View>
        <Text style={styles.title}>WELCOME TO THE APP!</Text>
        <Image source={img} style={{ height: 100, width: 100 }} />
      </View>
    );
  }

  if (products.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to my app!</Text>
        <Text>
          Hello world, this app requires a subscription to use, a purchase of the
          subscription grants you access to the entire app
        </Text>

        {products.map((p) => (
          <Button
            key={p["productId"]}
            title={`Purchase ${p["title"]} ${p["localizedPrice"]}`}
            onPress={() => {
              console.log('++Pressed++', p);
              // IAP.requestSubscription(p.productId);
              IAP.requestSubscription({ sku: p.productId }); // parameter object in the latest version
            }}
          />
        ))}
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text>Fetching products please wait...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    color: "red",
  },
});