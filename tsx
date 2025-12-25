          {(flow === "signIn" || flow === "signUp") && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                type="button" 
                className="w-full" 
                disabled={isLoading} 
                onClick={handleGoogleSignIn}
              >
