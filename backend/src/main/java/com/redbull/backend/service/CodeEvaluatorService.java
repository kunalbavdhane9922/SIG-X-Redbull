package com.redbull.backend.service;

import org.springframework.stereotype.Service;

import javax.tools.*;
import java.io.*;
import java.lang.reflect.Method;
import java.nio.file.*;
import java.net.URLClassLoader;
import java.util.*;
import java.util.regex.*;

@Service
public class CodeEvaluatorService {

    public record StageConfig(int stageNum, String methodSignature, String riddleText, int digit) {}

    public static final List<StageConfig> STAGES = List.of(
        new StageConfig(1, "sumArray", 
            "I traverse a list of numbers and gather their total strength. " +
            "Give me an int[] and I shall return the sum of all elements.", 
            1200),
        new StageConfig(2, "reverseString", 
            "I turn words around — give me a String and I return it reversed, " +
            "mirror-image perfect.", 
            34)
    );

    public boolean evaluate(int stage, String userCode) {
        try {
            // Find method name via regex to handle any naming the user chooses
            String methodName = findMethodName(userCode);
            if (methodName == null) return false;

            if (stage == 1) {
                return evaluateStage1(methodName, userCode);
            } else if (stage == 2) {
                return evaluateStage2(methodName, userCode);
            }
        } catch (Exception e) {
            System.err.println("Evaluation error: " + e.getMessage());
        }
        return false;
    }

    private String findMethodName(String code) {
        // Find something that looks like: returnType methodName(params) {
        Pattern pattern = Pattern.compile("(?:int|String|public|static|\\s)+\\s+([a-zA-Z0-9_]+)\\s*\\(");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null; // No identifiable method found
    }

    private boolean evaluateStage1(String methodName, String userCode) throws Exception {
        String fullClass = "public class Solution {\n" + userCode + "\n}";
        Class<?> cls = compile(fullClass, "Solution");
        if (cls == null) return false;

        Method m = cls.getDeclaredMethod(methodName, int[].class);
        m.setAccessible(true);
        
        Object instance = cls.getDeclaredConstructor().newInstance();
        Object r1 = m.invoke(instance, (Object) new int[]{1, 2, 3});
        if (!r1.equals(6)) return false;
        
        Object r2 = m.invoke(instance, (Object) new int[]{10, 20});
        if (!r2.equals(30)) return false;

        return true;
    }

    private boolean evaluateStage2(String methodName, String userCode) throws Exception {
        String fullClass = "public class Solution {\n" + userCode + "\n}";
        Class<?> cls = compile(fullClass, "Solution");
        if (cls == null) return false;

        Method m = cls.getDeclaredMethod(methodName, String.class);
        m.setAccessible(true);

        Object instance = cls.getDeclaredConstructor().newInstance();
        if (!"olleh".equals(m.invoke(instance, "hello"))) return false;
        if (!"a".equals(m.invoke(instance, "a"))) return false;

        return true;
    }

    private Class<?> compile(String sourceCode, String className) {
        try {
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            if (compiler == null) return null;

            Path tempDir = Files.createTempDirectory("build_");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, sourceCode);

            DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
            try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnostics, null, null)) {
                Iterable<? extends JavaFileObject> units = fileManager.getJavaFileObjects(sourceFile.toFile());
                JavaCompiler.CompilationTask task = compiler.getTask(null, fileManager, diagnostics, List.of("-d", tempDir.toString()), null, units);
                if (!task.call()) return null;
            }

            URLClassLoader classLoader = URLClassLoader.newInstance(new java.net.URL[]{tempDir.toUri().toURL()});
            return classLoader.loadClass(className);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean heuristicEvaluate(int stage, String code) {
        String normalized = code.toLowerCase().replaceAll("\\s+", "");
        if (stage == 1) {
            // Checks for loop + sum logic (Java/C++ styles)
            return (normalized.contains("+=") || normalized.contains("sum=") || normalized.contains("total=")) && 
                   (normalized.contains("for") || normalized.contains("while")) &&
                   (normalized.contains("return"));
        } else if (stage == 2) {
            // Checks for string builder reversal OR char-by-char loop in Java/C++
            return (normalized.contains("reverse") || normalized.contains("charat") || normalized.contains("length()-1")) &&
                   normalized.contains("return");
        }
        return false;
    }
}
