import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

type AuthHook = {
  user: User | null;
  loading: boolean;
};

export function useAuth(): AuthHook {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Error fetching session", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// // src/hooks/useAuth.ts
// import React, { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";
// import type { User } from "@supabase/supabase-js";

// type UserRole = "patient" | "doctor" | null;

// type AuthHook = {
//   user: User | null;
//   loading: boolean;
//   userRole: UserRole;
// };

// export function useAuth(): AuthHook {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [userRole, setUserRole] = useState<UserRole>(null);

//   useEffect(() => {
//     const getSession = async () => {
//       try {
//         const { data, error } = await supabase.auth.getSession();
//         if (error) throw error;

//         const currentUser = data.session?.user ?? null;
//         setUser(currentUser);

//         if (currentUser) {
//           // Check if user is a patient
//           const { data: patientData } = await supabase
//             .from("patients")
//             .select("id")
//             .eq("id", currentUser.id)
//             .single();

//           // Check if user is a doctor
//           const { data: doctorData } = await supabase
//             .from("doctors")
//             .select("id")
//             .eq("id", currentUser.id)
//             .single();

//           if (patientData) {
//             setUserRole("patient");
//           } else if (doctorData) {
//             setUserRole("doctor");
//           }
//         }
//       } catch (err) {
//         console.error("Error fetching session", err);
//         setUser(null);
//         setUserRole(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     getSession();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       const currentUser = session?.user ?? null;
//       setUser(currentUser);

//       if (currentUser) {
//         // Check user role when auth state changes
//         const { data: patientData } = await supabase
//           .from("patients")
//           .select("id")
//           .eq("id", currentUser.id)
//           .single();

//         const { data: doctorData } = await supabase
//           .from("doctors")
//           .select("id")
//           .eq("id", currentUser.id)
//           .single();

//         if (patientData) {
//           setUserRole("patient");
//         } else if (doctorData) {
//           setUserRole("doctor");
//         }
//       } else {
//         setUserRole(null);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   return { user, loading, userRole };
// }
