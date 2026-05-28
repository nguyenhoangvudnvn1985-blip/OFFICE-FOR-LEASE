import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const officeService = {
  // Buildings
  async getBuildings() {
    try {
      const snap = await getDocs(collection(db, 'buildings'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'buildings');
    }
  },

  async addBuilding(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'buildings'), data);
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'buildings');
    }
  },

  // Offices
  async getOffices(buildingId?: string) {
    try {
      let q = collection(db, 'offices');
      if (buildingId) {
        // @ts-ignore
        q = query(q, where('buildingId', '==', buildingId));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'offices');
    }
  },

  async addOffice(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'offices'), data);
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'offices');
    }
  },

  async updateOffice(id: string, data: any) {
    try {
      await updateDoc(doc(db, 'offices', id), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `offices/${id}`);
    }
  },

  async deleteOffice(id: string) {
    try {
      await deleteDoc(doc(db, 'offices', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `offices/${id}`);
    }
  },

  async softDeleteOffice(id: string) {
    try {
      await updateDoc(doc(db, 'offices', id), { isDeleted: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `offices/${id}`);
    }
  },

  async restoreOffice(id: string) {
    try {
      await updateDoc(doc(db, 'offices', id), { isDeleted: false });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `offices/${id}`);
    }
  },

  // Tenants
  async getTenants() {
    try {
      const snap = await getDocs(collection(db, 'tenants'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'tenants');
    }
  },

  async addTenant(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'tenants'), data);
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tenants');
    }
  },

  async updateTenant(id: string, data: any) {
    try {
      await updateDoc(doc(db, 'tenants', id), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tenants/${id}`);
    }
  },

  // Contracts
  async getContracts() {
    try {
      const snap = await getDocs(collection(db, 'contracts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'contracts');
    }
  },

  async addContract(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'contracts'), data);
      // Automatically update office status to rented
      if (data.officeId) {
        await updateDoc(doc(db, 'offices', data.officeId), { status: 'rented' });
      }
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contracts');
    }
  },

  async terminateContract(id: string, officeId: string) {
    if (!id || !officeId) {
      throw new Error("Mã hợp đồng hoặc mã văn phòng không hợp lệ.");
    }
    try {
      const batch = writeBatch(db);
      
      const contractRef = doc(db, 'contracts', id);
      const officeRef = doc(db, 'offices', officeId);
      
      batch.update(contractRef, { 
        status: 'terminated', 
        endDate: new Date().toISOString() 
      });
      
      batch.update(officeRef, { 
        status: 'available' 
      });
      
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `contracts/${id} and offices/${officeId}`);
    }
  },

  // Users Management
  async getUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
  },

  async updateUser(uid: string, data: any) {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async deleteUser(uid: string) {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
    }
  }
};
