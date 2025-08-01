import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            if (!authUser) {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile({ uid: doc.id, ...doc.data() });
                } else {
                    // Se o perfil não existir no Firestore, criamos um básico.
                    setUserProfile({ uid: user.uid, email: user.email, name: user.displayName || 'Novo Usuário', role: 'colaborador' });
                }
                setLoading(false);
            });
            return () => unsubscribeProfile();
        }
    }, [user]);

    return { user, userProfile, loading };
}