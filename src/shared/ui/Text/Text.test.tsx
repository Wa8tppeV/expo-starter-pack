import React from "react";

import { render, screen } from "@testing-library/react-native";

import { Text } from "./Text";

describe("Text Component", () => {
  describe("variant prop - Display", () => {
    it("should render with display variant", () => {
      render(
        <Text testID="display-text" variant="display">
          95
        </Text>,
      );
      const element = screen.getByTestId("display-text");

      expect(element.props.className).toContain("text-display");
      expect(element.props.className).toContain("font-manrope-extrabold");
    });

    it("should render with display-sm variant", () => {
      render(
        <Text testID="display-sm-text" variant="display-sm">
          48
        </Text>,
      );
      const element = screen.getByTestId("display-sm-text");

      expect(element.props.className).toContain("text-display-sm");
      expect(element.props.className).toContain("font-manrope-extrabold");
    });
  });

  describe("variant prop - Headings", () => {
    it("should render with h1 variant", () => {
      render(
        <Text testID="h1-text" variant="h1">
          Page Title
        </Text>,
      );
      const element = screen.getByTestId("h1-text");

      expect(element.props.className).toContain("text-h1");
      expect(element.props.className).toContain("font-manrope-bold");
    });

    it("should render with h1-sm variant", () => {
      render(
        <Text testID="h1-sm-text" variant="h1-sm">
          Small Title
        </Text>,
      );
      const element = screen.getByTestId("h1-sm-text");

      expect(element.props.className).toContain("text-h1-sm");
      expect(element.props.className).toContain("font-manrope-bold");
    });

    it("should render with h2 variant", () => {
      render(
        <Text testID="h2-text" variant="h2">
          Section
        </Text>,
      );
      const element = screen.getByTestId("h2-text");

      expect(element.props.className).toContain("text-h2");
      expect(element.props.className).toContain("font-manrope-semibold");
    });

    it("should render with h2-sm variant", () => {
      render(
        <Text testID="h2-sm-text" variant="h2-sm">
          Small Section
        </Text>,
      );
      const element = screen.getByTestId("h2-sm-text");

      expect(element.props.className).toContain("text-h2-sm");
      expect(element.props.className).toContain("font-manrope-semibold");
    });

    it("should render with h3 variant", () => {
      render(
        <Text testID="h3-text" variant="h3">
          Subsection
        </Text>,
      );
      const element = screen.getByTestId("h3-text");

      expect(element.props.className).toContain("text-h3");
      expect(element.props.className).toContain("font-manrope-semibold");
    });

    it("should render with h3-sm variant", () => {
      render(
        <Text testID="h3-sm-text" variant="h3-sm">
          Small Sub
        </Text>,
      );
      const element = screen.getByTestId("h3-sm-text");

      expect(element.props.className).toContain("text-h3-sm");
      expect(element.props.className).toContain("font-manrope-semibold");
    });
  });

  describe("variant prop - Body", () => {
    it("should render with body variant", () => {
      render(
        <Text testID="body-text" variant="body">
          Body text
        </Text>,
      );
      const element = screen.getByTestId("body-text");

      expect(element.props.className).toContain("text-body");
      expect(element.props.className).toContain("font-manrope");
    });

    it("should render with body-sm variant", () => {
      render(
        <Text testID="body-sm-text" variant="body-sm">
          Small body
        </Text>,
      );
      const element = screen.getByTestId("body-sm-text");

      expect(element.props.className).toContain("text-body-sm");
      expect(element.props.className).toContain("font-manrope");
    });

    it("should render with body-medium variant", () => {
      render(
        <Text testID="body-medium-text" variant="body-medium">
          Medium body
        </Text>,
      );
      const element = screen.getByTestId("body-medium-text");

      expect(element.props.className).toContain("text-body");
      expect(element.props.className).toContain("font-manrope-medium");
    });
  });

  describe("variant prop - Caption and Small", () => {
    it("should render with caption variant", () => {
      render(
        <Text testID="caption-text" variant="caption">
          Caption text
        </Text>,
      );
      const element = screen.getByTestId("caption-text");

      expect(element.props.className).toContain("text-caption");
      expect(element.props.className).toContain("font-manrope-medium");
    });

    it("should render with caption-sm variant", () => {
      render(
        <Text testID="caption-sm-text" variant="caption-sm">
          Small caption
        </Text>,
      );
      const element = screen.getByTestId("caption-sm-text");

      expect(element.props.className).toContain("text-caption-sm");
      expect(element.props.className).toContain("font-manrope-medium");
    });

    it("should render with small variant", () => {
      render(
        <Text testID="small-text" variant="small">
          Fine print
        </Text>,
      );
      const element = screen.getByTestId("small-text");

      expect(element.props.className).toContain("text-small");
      expect(element.props.className).toContain("font-manrope");
    });
  });

  describe("custom className prop", () => {
    it("should merge variant classes with custom className", () => {
      render(
        <Text testID="colored-heading" variant="h1" className="text-blue-500">
          Colored Heading
        </Text>,
      );
      const element = screen.getByTestId("colored-heading");

      const className = element.props.className;
      expect(className).toContain("text-h1");
      expect(className).toContain("font-manrope-bold");
      expect(className).toContain("text-blue-500");
    });

    it("should add additional utility classes", () => {
      render(
        <Text testID="padded-text" variant="body" className="mb-4 px-2">
          Padded Text
        </Text>,
      );
      const element = screen.getByTestId("padded-text");

      const className = element.props.className;
      expect(className).toContain("text-body");
      expect(className).toContain("font-manrope");
      expect(className).toContain("mb-4");
      expect(className).toContain("px-2");
    });

    it("should work without variant", () => {
      render(
        <Text testID="custom-text" className="text-red-500">
          Custom styled text
        </Text>,
      );
      const element = screen.getByTestId("custom-text");

      expect(element.props.className).toBe("text-content text-red-500");
    });
  });

  describe("children rendering", () => {
    it("should render string children", () => {
      const content = "Hello World";
      render(<Text testID="string-children">{content}</Text>);
      const element = screen.getByTestId("string-children");

      expect(element.props.children).toBe(content);
    });

    it("should render empty component", () => {
      render(<Text testID="empty-text" />);
      const element = screen.getByTestId("empty-text");

      expect(element).toBeTruthy();
    });

    it("should render number children", () => {
      render(
        <Text testID="number-children" variant="display">
          {95}
        </Text>,
      );
      const element = screen.getByTestId("number-children");

      expect(element.props.children).toBe(95);
    });

    it("should render by text content", () => {
      render(
        <Text testID="content-text" variant="h2">
          Hello World
        </Text>,
      );

      expect(screen.getByText("Hello World")).toBeTruthy();
    });
  });

  describe("React Native Text props forwarding", () => {
    it("should forward numberOfLines prop", () => {
      render(
        <Text testID="lines-text" numberOfLines={2}>
          Long text
        </Text>,
      );
      const element = screen.getByTestId("lines-text");

      expect(element.props.numberOfLines).toBe(2);
    });

    it("should forward ellipsizeMode prop", () => {
      render(
        <Text testID="ellipsize-text" ellipsizeMode="tail">
          Long text
        </Text>,
      );
      const element = screen.getByTestId("ellipsize-text");

      expect(element.props.ellipsizeMode).toBe("tail");
    });

    it("should forward onPress prop", () => {
      const onPress = jest.fn();
      render(
        <Text testID="press-text" onPress={onPress}>
          Pressable
        </Text>,
      );
      const element = screen.getByTestId("press-text");

      expect(element.props.onPress).toBe(onPress);
    });

    it("should forward selectable prop", () => {
      render(
        <Text testID="selectable-text" selectable={true}>
          Selectable text
        </Text>,
      );
      const element = screen.getByTestId("selectable-text");

      expect(element.props.selectable).toBe(true);
    });

    it("should forward multiple props together", () => {
      const onPress = jest.fn();
      render(
        <Text
          testID="multi-props-text"
          variant="body"
          numberOfLines={1}
          ellipsizeMode="tail"
          onPress={onPress}
          selectable={false}
          className="text-gray-500"
        >
          Multi-prop text
        </Text>,
      );
      const element = screen.getByTestId("multi-props-text");

      expect(element.props.numberOfLines).toBe(1);
      expect(element.props.ellipsizeMode).toBe("tail");
      expect(element.props.onPress).toBe(onPress);
      expect(element.props.selectable).toBe(false);
      expect(element.props.className).toContain("text-gray-500");
    });
  });

  describe("edge cases", () => {
    it("should render without variant prop", () => {
      render(<Text testID="no-variant-text">Unstyled</Text>);
      const element = screen.getByTestId("no-variant-text");

      expect(element.props.className.trim()).toBe("text-content");
    });

    it("should handle empty className gracefully", () => {
      render(
        <Text testID="empty-class-text" variant="h1" className="">
          Heading
        </Text>,
      );
      const element = screen.getByTestId("empty-class-text");

      expect(element.props.className).toContain("text-h1");
      expect(element.props.className).toContain("font-manrope-bold");
    });

    it("should trim whitespace from className", () => {
      render(
        <Text
          testID="trim-class-text"
          variant="body"
          className="  text-blue-500  "
        >
          Trimmed
        </Text>,
      );
      const element = screen.getByTestId("trim-class-text");

      const className = element.props.className;
      expect(className?.trim()).toBe(className);
    });
  });

  describe("complete integration tests", () => {
    it("should render all typography variants correctly", () => {
      const variants = [
        "display",
        "display-sm",
        "h1",
        "h1-sm",
        "h2",
        "h2-sm",
        "h3",
        "h3-sm",
        "body",
        "body-sm",
        "body-medium",
        "caption",
        "caption-sm",
        "small",
      ] as const;

      variants.forEach((variant) => {
        const { unmount } = render(
          <Text testID={`variant-${variant}`} variant={variant}>
            Test {variant}
          </Text>,
        );
        const element = screen.getByTestId(`variant-${variant}`);

        expect(element).toBeTruthy();
        expect(element.props.className).toBeTruthy();
        expect(typeof element.props.className).toBe("string");

        unmount();
      });
    });

    it("should combine multiple Tailwind classes correctly", () => {
      render(
        <Text
          testID="complex-style-text"
          variant="h1"
          className="mb-4 px-2 leading-tight text-blue-500"
        >
          Complex styling
        </Text>,
      );
      const element = screen.getByTestId("complex-style-text");

      const className = element.props.className;
      expect(className).toContain("text-h1");
      expect(className).toContain("font-manrope-bold");
      expect(className).toContain("text-blue-500");
      expect(className).toContain("mb-4");
      expect(className).toContain("px-2");
      expect(className).toContain("leading-tight");
    });

    it("should handle variant + custom classes + props together", () => {
      const onPress = jest.fn();
      render(
        <Text
          testID="full-integration"
          variant="caption"
          className="text-gray-600 underline"
          numberOfLines={1}
          onPress={onPress}
        >
          Full integration test
        </Text>,
      );
      const element = screen.getByTestId("full-integration");

      expect(element.props.className).toContain("text-caption");
      expect(element.props.className).toContain("font-manrope-medium");
      expect(element.props.className).toContain("text-gray-600");
      expect(element.props.className).toContain("underline");
      expect(element.props.numberOfLines).toBe(1);
      expect(element.props.onPress).toBe(onPress);
    });
  });
});
