import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://192.168.0.8:3000';

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Animación suave del título y botón
  const animatedValue = new Animated.Value(isLogin ? 0 : 1);

  const animate = (toValue: number) =>
    Animated.timing(animatedValue, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    animate(isLogin ? 1 : 0);
    setName('');
  };

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        Alert.alert('Éxito', 'Sesión iniciada');
        // Aquí puedes guardar el token con AsyncStorage si quieres
        navigation.replace('Home', { user: res.data.user });
      } else {
        await axios.post(`${API_URL}/users/register`, { name, email, password });
        Alert.alert('Éxito', 'Cuenta creada, ahora inicia sesión');
        toggleForm();
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Algo salió mal');
    }
  };

  const titleTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const buttonScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Animated.Text style={[styles.title, { transform: [{ translateY: titleTranslateY }] }]}>
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </Animated.Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Animated.Text style={[styles.buttonText, { transform: [{ scale: buttonScale }] }]}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleForm} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  inner: { flex: 1, justifyContent: 'center', padding: 30 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#007bff',
    fontSize: 16,
  },
});